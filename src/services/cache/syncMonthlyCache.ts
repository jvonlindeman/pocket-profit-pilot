
import { supabase } from "../../integrations/supabase/client";

/**
 * Sync monthly_cache table with existing cached_transactions data
 */
export class MonthlyCacheSync {
  /**
   * DIAGNOSTIC ONLY: Check what entries are missing without making any changes
   */
  static async diagnoseMissingEntries(): Promise<{ 
    missingEntries: Array<{ source: string; year: number; month: number; transactionCount: number }>;
    totalMissing: number;
    errors: number;
  }> {
    try {
      console.log("[MONTHLY_CACHE_DIAGNOSTIC] Starting READ-ONLY diagnostic of missing monthly cache entries");
      
      // Get all unique source/year/month combinations from cached_transactions
      const { data: transactionGroups, error } = await supabase
        .from('cached_transactions')
        .select('source, year, month')
        .not('year', 'is', null)
        .not('month', 'is', null);
        
      if (error) {
        console.error("[MONTHLY_CACHE_DIAGNOSTIC] Error fetching cached transactions:", error);
        return { missingEntries: [], totalMissing: 0, errors: 1 };
      }
      
      if (!transactionGroups || transactionGroups.length === 0) {
        console.log("[MONTHLY_CACHE_DIAGNOSTIC] No cached transactions found");
        return { missingEntries: [], totalMissing: 0, errors: 0 };
      }
      
      // Group by source/year/month and count transactions
      const groupedEntries = new Map<string, { source: string; year: number; month: number; count: number }>();
      
      transactionGroups.forEach(entry => {
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
      
      console.log(`[MONTHLY_CACHE_DIAGNOSTIC] Found ${groupedEntries.size} unique source/year/month combinations`);
      
      const missingEntries: Array<{ source: string; year: number; month: number; transactionCount: number }> = [];
      let errors = 0;
      
      // Check which entries are missing in monthly_cache (READ-ONLY)
      for (const [key, entry] of groupedEntries) {
        try {
          // Check if this entry already exists in monthly_cache
          const { data: existingEntry } = await supabase
            .from('monthly_cache')
            .select('id')
            .eq('source', entry.source)
            .eq('year', entry.year)
            .eq('month', entry.month)
            .single();
            
          if (!existingEntry) {
            // Get actual count from database
            const { count, error: countError } = await supabase
              .from('cached_transactions')
              .select('id', { count: 'exact' })
              .eq('source', entry.source)
              .eq('year', entry.year)
              .eq('month', entry.month);
              
            if (countError) {
              console.error(`[MONTHLY_CACHE_DIAGNOSTIC] Error counting transactions for ${key}:`, countError);
              errors++;
              continue;
            }
            
            const actualCount = count || 0;
            
            if (actualCount > 0) {
              missingEntries.push({
                source: entry.source,
                year: entry.year,
                month: entry.month,
                transactionCount: actualCount
              });
              console.log(`[MONTHLY_CACHE_DIAGNOSTIC] Missing: ${key} with ${actualCount} transactions`);
            }
          }
        } catch (err) {
          console.error(`[MONTHLY_CACHE_DIAGNOSTIC] Exception checking ${key}:`, err);
          errors++;
        }
      }
      
      console.log(`[MONTHLY_CACHE_DIAGNOSTIC] Diagnostic complete: ${missingEntries.length} missing entries found, ${errors} errors`);
      return { missingEntries, totalMissing: missingEntries.length, errors };
    } catch (err) {
      console.error("[MONTHLY_CACHE_DIAGNOSTIC] Exception during diagnostic:", err);
      return { missingEntries: [], totalMissing: 0, errors: 1 };
    }
  }

  /**
   * DANGEROUS: Actually sync missing entries (requires explicit confirmation)
   */
  static async syncAllMissingEntries(): Promise<{ synced: number; errors: number }> {
    console.warn("[MONTHLY_CACHE_SYNC] ⚠️  DANGER: This operation will write to database and may trigger webhooks!");
    
    try {
      console.log("[MONTHLY_CACHE_SYNC] Starting ACTUAL sync of missing monthly cache entries");
      
      // First get the diagnostic
      const diagnostic = await this.diagnoseMissingEntries();
      
      if (diagnostic.totalMissing === 0) {
        console.log("[MONTHLY_CACHE_SYNC] No missing entries to sync");
        return { synced: 0, errors: diagnostic.errors };
      }
      
      let synced = 0;
      let errors = diagnostic.errors;
      
      // Process each missing entry
      for (const entry of diagnostic.missingEntries) {
        try {
          console.log(`[MONTHLY_CACHE_SYNC] Syncing ${entry.source} ${entry.year}/${entry.month} with ${entry.transactionCount} transactions`);
          
          // Insert into monthly_cache (THIS MAY TRIGGER WEBHOOKS)
          const { error: insertError } = await supabase
            .from('monthly_cache')
            .insert({
              source: entry.source,
              year: entry.year,
              month: entry.month,
              transaction_count: entry.transactionCount,
              status: 'complete',
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`[MONTHLY_CACHE_SYNC] Error inserting monthly_cache entry for ${entry.source} ${entry.year}/${entry.month}:`, insertError);
            errors++;
          } else {
            console.log(`[MONTHLY_CACHE_SYNC] Successfully synced ${entry.source} ${entry.year}/${entry.month}`);
            synced++;
          }
        } catch (err) {
          console.error(`[MONTHLY_CACHE_SYNC] Exception processing ${entry.source} ${entry.year}/${entry.month}:`, err);
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
    console.warn("[MONTHLY_CACHE_SYNC] ⚠️  DANGER: This operation will write to database and may trigger webhooks!");
    
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
      
      // Upsert the monthly cache entry (THIS MAY TRIGGER WEBHOOKS)
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
