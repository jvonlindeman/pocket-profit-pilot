export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          include_zoho_fifty_percent: boolean | null
          itbm_amount: number | null
          month_year: string
          notes: string | null
          opex_amount: number | null
          profit_percentage: number | null
          stripe_override: number | null
          tax_reserve_percentage: number | null
          updated_at: string
        }
        Insert: {
          balance: number
          created_at?: string
          id?: number
          include_zoho_fifty_percent?: boolean | null
          itbm_amount?: number | null
          month_year: string
          notes?: string | null
          opex_amount?: number | null
          profit_percentage?: number | null
          stripe_override?: number | null
          tax_reserve_percentage?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: number
          include_zoho_fifty_percent?: boolean | null
          itbm_amount?: number | null
          month_year?: string
          notes?: string | null
          opex_amount?: number | null
          profit_percentage?: number | null
          stripe_override?: number | null
          tax_reserve_percentage?: number | null
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
      monthly_financial_summaries: {
        Row: {
          cache_segment_ids: Json | null
          collaborator_expense: number
          created_at: string
          data_sources: Json | null
          expense_trend: string | null
          id: string
          income_trend: string | null
          is_seasonal_high: boolean | null
          is_seasonal_low: boolean | null
          mom_expense_change: number | null
          mom_income_change: number | null
          mom_profit_change: number | null
          month: number
          other_expense: number
          profit: number
          profit_margin: number
          profit_trend: string | null
          seasonal_variance: number | null
          starting_balance: number | null
          total_expense: number
          total_income: number
          transaction_count: number
          updated_at: string
          year: number
        }
        Insert: {
          cache_segment_ids?: Json | null
          collaborator_expense?: number
          created_at?: string
          data_sources?: Json | null
          expense_trend?: string | null
          id?: string
          income_trend?: string | null
          is_seasonal_high?: boolean | null
          is_seasonal_low?: boolean | null
          mom_expense_change?: number | null
          mom_income_change?: number | null
          mom_profit_change?: number | null
          month: number
          other_expense?: number
          profit?: number
          profit_margin?: number
          profit_trend?: string | null
          seasonal_variance?: number | null
          starting_balance?: number | null
          total_expense?: number
          total_income?: number
          transaction_count?: number
          updated_at?: string
          year: number
        }
        Update: {
          cache_segment_ids?: Json | null
          collaborator_expense?: number
          created_at?: string
          data_sources?: Json | null
          expense_trend?: string | null
          id?: string
          income_trend?: string | null
          is_seasonal_high?: boolean | null
          is_seasonal_low?: boolean | null
          mom_expense_change?: number | null
          mom_income_change?: number | null
          mom_profit_change?: number | null
          month?: number
          other_expense?: number
          profit?: number
          profit_margin?: number
          profit_trend?: string | null
          seasonal_variance?: number | null
          starting_balance?: number | null
          total_expense?: number
          total_income?: number
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
      calculate_monthly_trends: {
        Args: { target_year: number; target_month: number }
        Returns: boolean
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
      get_monthly_summaries_for_ai: {
        Args: { months_back?: number }
        Returns: {
          year: number
          month: number
          total_income: number
          total_expense: number
          profit: number
          profit_margin: number
          mom_income_change: number
          mom_expense_change: number
          mom_profit_change: number
          income_trend: string
          expense_trend: string
          profit_trend: string
          transaction_count: number
        }[]
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
      update_transaction_embedding: {
        Args: { transaction_id: string; embedding: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
