
import { supabase } from "../../integrations/supabase/client";

/**
 * Sync monthly_cache table with existing cached_transactions data
 */
export class MonthlyCacheSync {
  /**
   * Sync all missing monthly cache entries
   */
  static async syncAllMissingEntries(): Promise<{ synced: number; errors: number }> {
    try {
      console.log("[MONTHLY_CACHE_SYNC] Starting sync of all missing monthly cache entries");
      
      // Get all unique source/year/month combinations from cached_transactions
      // that don't exist in monthly_cache
      const { data: missingEntries, error } = await supabase
        .from('cached_transactions')
        .select('source, year, month')
        .not('year', 'is', null)
        .not('month', 'is', null);
        
      if (error) {
        console.error("[MONTHLY_CACHE_SYNC] Error fetching cached transactions:", error);
        return { synced: 0, errors: 1 };
      }
      
      if (!missingEntries || missingEntries.length === 0) {
        console.log("[MONTHLY_CACHE_SYNC] No cached transactions found");
        return { synced: 0, errors: 0 };
      }
      
      // Group by source/year/month and count transactions
      const groupedEntries = new Map<string, { source: string; year: number; month: number; count: number }>();
      
      missingEntries.forEach(entry => {
        if (entry.year && entry.month) {
          const key = `${entry.source}-${entry.year}-${entry.month}`;
          if (groupedEntries.has(key)) {
            groupedEntries.get(key)!.count += 1;
          } else {
            groupedEntries.set(key, {
              source: entry.source,
              year: entry.year,
              month: entry.month,
              count: 1
            });
          }
        }
      });
      
      console.log(`[MONTHLY_CACHE_SYNC] Found ${groupedEntries.size} unique source/year/month combinations`);
      
      let synced = 0;
      let errors = 0;
      
      // Process each unique combination
      for (const [key, entry] of groupedEntries) {
        try {
          console.log(`[MONTHLY_CACHE_SYNC] Processing ${key} with ${entry.count} transactions`);
          
          // Check if this entry already exists in monthly_cache
          const { data: existingEntry } = await supabase
            .from('monthly_cache')
            .select('id')
            .eq('source', entry.source)
            .eq('year', entry.year)
            .eq('month', entry.month)
            .single();
            
          if (existingEntry) {
            console.log(`[MONTHLY_CACHE_SYNC] Entry ${key} already exists in monthly_cache, skipping`);
            continue;
          }
          
          // Get actual count from database
          const { count, error: countError } = await supabase
            .from('cached_transactions')
            .select('id', { count: 'exact' })
            .eq('source', entry.source)
            .eq('year', entry.year)
            .eq('month', entry.month);
            
          if (countError) {
            console.error(`[MONTHLY_CACHE_SYNC] Error counting transactions for ${key}:`, countError);
            errors++;
            continue;
          }
          
          const actualCount = count || 0;
          
          if (actualCount === 0) {
            console.log(`[MONTHLY_CACHE_SYNC] No transactions found for ${key}, skipping`);
            continue;
          }
          
          // Insert into monthly_cache
          const { error: insertError } = await supabase
            .from('monthly_cache')
            .insert({
              source: entry.source,
              year: entry.year,
              month: entry.month,
              transaction_count: actualCount,
              status: 'complete',
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`[MONTHLY_CACHE_SYNC] Error inserting monthly_cache entry for ${key}:`, insertError);
            errors++;
          } else {
            console.log(`[MONTHLY_CACHE_SYNC] Successfully synced ${key} with ${actualCount} transactions`);
            synced++;
          }
        } catch (err) {
          console.error(`[MONTHLY_CACHE_SYNC] Exception processing ${key}:`, err);
          errors++;
        }
      }
      
      console.log(`[MONTHLY_CACHE_SYNC] Sync complete: ${synced} entries synced, ${errors} errors`);
      return { synced, errors };
    } catch (err) {
      console.error("[MONTHLY_CACHE_SYNC] Exception during sync:", err);
      return { synced: 0, errors: 1 };
    }
  }

  /**
   * Sync a specific month's cache entry
   */
  static async syncMonth(source: string, year: number, month: number): Promise<boolean> {
    try {
      console.log(`[MONTHLY_CACHE_SYNC] Syncing specific month: ${source} ${year}/${month}`);
      
      // Get transaction count for this month
      const { count, error } = await supabase
        .from('cached_transactions')
        .select('id', { count: 'exact' })
        .eq('source', source)
        .eq('year', year)
        .eq('month', month);
        
      if (error) {
        console.error(`[MONTHLY_CACHE_SYNC] Error counting transactions:`, error);
        return false;
      }
      
      const transactionCount = count || 0;
      
      if (transactionCount === 0) {
        console.log(`[MONTHLY_CACHE_SYNC] No transactions found for ${source} ${year}/${month}`);
        return false;
      }
      
      // Upsert the monthly cache entry
      const { error: upsertError } = await supabase
        .from('monthly_cache')
        .upsert({
          source,
          year,
          month,
          transaction_count: transactionCount,
          status: 'complete',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source,year,month'
        });
        
      if (upsertError) {
        console.error(`[MONTHLY_CACHE_SYNC] Error upserting monthly cache:`, upsertError);
        return false;
      }
      
      console.log(`[MONTHLY_CACHE_SYNC] Successfully synced ${source} ${year}/${month} with ${transactionCount} transactions`);
      return true;
    } catch (err) {
      console.error(`[MONTHLY_CACHE_SYNC] Exception syncing month:`, err);
      return false;
    }
  }
}
