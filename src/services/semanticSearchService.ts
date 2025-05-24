
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/financial';

export interface SemanticSearchResult extends Transaction {
  similarity: number;
}

export interface SemanticSearchQuery {
  query: string;
  similarityThreshold?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Performs semantic search on transactions using natural language queries
 */
export const searchTransactionsSemantic = async (
  searchQuery: SemanticSearchQuery
): Promise<SemanticSearchResult[]> => {
  try {
    console.log('Performing semantic search:', searchQuery);

    // First, generate embedding for the search query via edge function
    const { data, error } = await supabase.functions.invoke('financial-assistant', {
      body: {
        messages: [{ role: 'user', content: `[SEMANTIC_SEARCH] ${searchQuery.query}` }],
        dateRange: {
          startDate: searchQuery.startDate?.toISOString() || null,
          endDate: searchQuery.endDate?.toISOString() || null,
        },
        semanticSearch: true,
        searchParams: {
          similarity_threshold: searchQuery.similarityThreshold || 0.6,
          limit_count: searchQuery.limit || 15
        }
      },
    });

    if (error) {
      console.error('Semantic search error:', error);
      throw new Error(error.message || 'Error en búsqueda semántica');
    }

    return data?.searchResults || [];
  } catch (err) {
    console.error('Exception in semantic search:', err);
    throw new Error('Error realizando búsqueda semántica');
  }
};

/**
 * Finds transactions similar to a specific transaction
 */
export const findSimilarTransactions = async (
  transactionId: string,
  similarityThreshold: number = 0.8,
  limit: number = 10
): Promise<SemanticSearchResult[]> => {
  try {
    console.log('Finding similar transactions for:', transactionId);

    const { data, error } = await supabase.rpc('find_similar_transactions', {
      reference_transaction_id: transactionId,
      similarity_threshold: similarityThreshold,
      limit_count: limit
    });

    if (error) {
      console.error('Similar transactions search error:', error);
      throw new Error(error.message || 'Error buscando transacciones similares');
    }

    // Transform database results to match our Transaction interface
    return (data || []).map((result: any) => ({
      id: result.external_id,
      date: result.date,
      amount: Number(result.amount),
      description: result.description,
      category: result.category,
      type: result.type,
      source: result.source,
      similarity: result.similarity
    }));
  } catch (err) {
    console.error('Exception finding similar transactions:', err);
    throw new Error('Error buscando transacciones similares');
  }
};

/**
 * Checks if semantic search is available (i.e., if transactions have embeddings)
 */
export const checkSemanticSearchAvailability = async (): Promise<{
  available: boolean;
  embeddedCount: number;
  totalCount: number;
}> => {
  try {
    const { data: totalResult } = await supabase
      .from('cached_transactions')
      .select('id', { count: 'exact', head: true });

    const { data: embeddedResult } = await supabase
      .from('cached_transactions')
      .select('id', { count: 'exact', head: true })
      .not('description_embedding', 'is', null);

    const totalCount = totalResult?.length || 0;
    const embeddedCount = embeddedResult?.length || 0;

    return {
      available: embeddedCount > 0,
      embeddedCount,
      totalCount
    };
  } catch (err) {
    console.error('Error checking semantic search availability:', err);
    return {
      available: false,
      embeddedCount: 0,
      totalCount: 0
    };
  }
};
