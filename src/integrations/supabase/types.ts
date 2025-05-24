export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cache_metrics: {
        Row: {
          cache_hit: boolean
          end_date: string
          fetch_duration_ms: number | null
          id: string
          partial_hit: boolean
          refresh_triggered: boolean
          request_id: string | null
          source: string
          start_date: string
          timestamp: string | null
          transaction_count: number | null
          user_agent: string | null
        }
        Insert: {
          cache_hit: boolean
          end_date: string
          fetch_duration_ms?: number | null
          id?: string
          partial_hit: boolean
          refresh_triggered: boolean
          request_id?: string | null
          source: string
          start_date: string
          timestamp?: string | null
          transaction_count?: number | null
          user_agent?: string | null
        }
        Update: {
          cache_hit?: boolean
          end_date?: string
          fetch_duration_ms?: number | null
          id?: string
          partial_hit?: boolean
          refresh_triggered?: boolean
          request_id?: string | null
          source?: string
          start_date?: string
          timestamp?: string | null
          transaction_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      cache_segments: {
        Row: {
          end_date: string
          id: string
          last_refreshed_at: string | null
          metadata: Json | null
          source: string
          start_date: string
          status: string
          transaction_count: number
        }
        Insert: {
          end_date: string
          id?: string
          last_refreshed_at?: string | null
          metadata?: Json | null
          source: string
          start_date: string
          status?: string
          transaction_count?: number
        }
        Update: {
          end_date?: string
          id?: string
          last_refreshed_at?: string | null
          metadata?: Json | null
          source?: string
          start_date?: string
          status?: string
          transaction_count?: number
        }
        Relationships: []
      }
      cached_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          description: string | null
          description_embedding: string | null
          external_id: string
          fees: number | null
          fetched_at: string | null
          gross: number | null
          id: string
          metadata: Json | null
          month: number | null
          source: string
          type: string
          year: number | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          description_embedding?: string | null
          external_id: string
          fees?: number | null
          fetched_at?: string | null
          gross?: number | null
          id?: string
          metadata?: Json | null
          month?: number | null
          source: string
          type: string
          year?: number | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          description_embedding?: string | null
          external_id?: string
          fees?: number | null
          fetched_at?: string | null
          gross?: number | null
          id?: string
          metadata?: Json | null
          month?: number | null
          source?: string
          type?: string
          year?: number | null
        }
        Relationships: []
      }
      financial_summaries: {
        Row: {
          cache_segment_id: string | null
          collaborator_expense: number
          created_at: string
          date_range_end: string
          date_range_start: string
          id: string
          metadata: Json | null
          other_expense: number
          profit: number
          profit_margin: number
          starting_balance: number | null
          total_expense: number
          total_income: number
          updated_at: string
        }
        Insert: {
          cache_segment_id?: string | null
          collaborator_expense?: number
          created_at?: string
          date_range_end: string
          date_range_start: string
          id?: string
          metadata?: Json | null
          other_expense?: number
          profit?: number
          profit_margin?: number
          starting_balance?: number | null
          total_expense?: number
          total_income?: number
          updated_at?: string
        }
        Update: {
          cache_segment_id?: string | null
          collaborator_expense?: number
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          id?: string
          metadata?: Json | null
          other_expense?: number
          profit?: number
          profit_margin?: number
          starting_balance?: number | null
          total_expense?: number
          total_income?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_summaries_cache_segment_id_fkey"
            columns: ["cache_segment_id"]
            isOneToOne: false
            referencedRelation: "cache_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_balances: {
        Row: {
          balance: number
          created_at: string
          id: number
          itbm_amount: number | null
          month_year: string
          notes: string | null
          opex_amount: number | null
          profit_percentage: number | null
          stripe_override: number | null
          updated_at: string
        }
        Insert: {
          balance: number
          created_at?: string
          id?: number
          itbm_amount?: number | null
          month_year: string
          notes?: string | null
          opex_amount?: number | null
          profit_percentage?: number | null
          stripe_override?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: number
          itbm_amount?: number | null
          month_year?: string
          notes?: string | null
          opex_amount?: number | null
          profit_percentage?: number | null
          stripe_override?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_cache: {
        Row: {
          created_at: string
          id: string
          month: number
          source: string
          status: string
          transaction_count: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          source: string
          status?: string
          transaction_count?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          source?: string
          status?: string
          transaction_count?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      zoho_integration: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string
          id: string
          organization_id: string | null
          refresh_token: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          organization_id?: string | null
          refresh_token: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          refresh_token?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      find_similar_transactions: {
        Args: {
          reference_transaction_id: string
          similarity_threshold?: number
          limit_count?: number
        }
        Returns: {
          id: string
          external_id: string
          description: string
          amount: number
          date: string
          category: string
          type: string
          source: string
          similarity: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_date_range_cached: {
        Args: { p_source: string; p_start_date: string; p_end_date: string }
        Returns: {
          is_cached: boolean
          is_partial: boolean
          segments_found: number
          missing_start_date: string
          missing_end_date: string
        }[]
      }
      is_month_cached: {
        Args: { p_source: string; p_year: number; p_month: number }
        Returns: {
          is_cached: boolean
          transaction_count: number
        }[]
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      search_transactions_semantic: {
        Args: {
          query_embedding: string
          similarity_threshold?: number
          limit_count?: number
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          id: string
          external_id: string
          description: string
          amount: number
          date: string
          category: string
          type: string
          source: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_transaction_embedding: {
        Args: { transaction_id: string; embedding: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
