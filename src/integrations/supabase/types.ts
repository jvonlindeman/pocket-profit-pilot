export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
        Relationships: []
      }
      monthly_balances: {
        Row: {
          balance: number
          business_commission_rate: number | null
          created_at: string
          id: number
          include_zoho_fifty_percent: boolean | null
          itbm_amount: number | null
          month_year: string
          notes: string | null
          opex_amount: number | null
          profit_percentage: number | null
          stripe_override: number | null
          stripe_savings_percentage: number | null
          tax_reserve_percentage: number | null
          updated_at: string
        }
        Insert: {
          balance: number
          business_commission_rate?: number | null
          created_at?: string
          id?: number
          include_zoho_fifty_percent?: boolean | null
          itbm_amount?: number | null
          month_year: string
          notes?: string | null
          opex_amount?: number | null
          profit_percentage?: number | null
          stripe_override?: number | null
          stripe_savings_percentage?: number | null
          tax_reserve_percentage?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number
          business_commission_rate?: number | null
          created_at?: string
          id?: number
          include_zoho_fifty_percent?: boolean | null
          itbm_amount?: number | null
          month_year?: string
          notes?: string | null
          opex_amount?: number | null
          profit_percentage?: number | null
          stripe_override?: number | null
          stripe_savings_percentage?: number | null
          tax_reserve_percentage?: number | null
          updated_at?: string
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
      receivables_selections: {
        Row: {
          amount: number
          created_at: string
          id: string
          item_id: string
          metadata: Json | null
          selected: boolean
          selection_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          item_id: string
          metadata?: Json | null
          selected?: boolean
          selection_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          item_id?: string
          metadata?: Json | null
          selected?: boolean
          selection_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      retainers: {
        Row: {
          active: boolean
          articles_per_month: number
          base_income: number
          canceled_at: string | null
          client_name: string
          client_status: string | null
          client_status_date: string | null
          created_at: string
          has_whatsapp_bot: boolean
          id: string
          is_legacy: boolean
          metadata: Json
          n8n_id: string | null
          net_income: number
          notes: string | null
          paused_at: string | null
          social_media_cost: number
          specialty: string | null
          total_expenses: number
          updated_at: string
          upsell_income: number
          uses_stripe: boolean
        }
        Insert: {
          active?: boolean
          articles_per_month?: number
          base_income?: number
          canceled_at?: string | null
          client_name: string
          client_status?: string | null
          client_status_date?: string | null
          created_at?: string
          has_whatsapp_bot?: boolean
          id?: string
          is_legacy?: boolean
          metadata?: Json
          n8n_id?: string | null
          net_income?: number
          notes?: string | null
          paused_at?: string | null
          social_media_cost?: number
          specialty?: string | null
          total_expenses?: number
          updated_at?: string
          upsell_income?: number
          uses_stripe?: boolean
        }
        Update: {
          active?: boolean
          articles_per_month?: number
          base_income?: number
          canceled_at?: string | null
          client_name?: string
          client_status?: string | null
          client_status_date?: string | null
          created_at?: string
          has_whatsapp_bot?: boolean
          id?: string
          is_legacy?: boolean
          metadata?: Json
          n8n_id?: string | null
          net_income?: number
          notes?: string | null
          paused_at?: string | null
          social_media_cost?: number
          specialty?: string | null
          total_expenses?: number
          updated_at?: string
          upsell_income?: number
          uses_stripe?: boolean
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
        Args: { target_month: number; target_year: number }
        Returns: boolean
      }
      find_similar_transactions: {
        Args: {
          limit_count?: number
          reference_transaction_id: string
          similarity_threshold?: number
        }
        Returns: {
          amount: number
          category: string
          date: string
          description: string
          external_id: string
          id: string
          similarity: number
          source: string
          type: string
        }[]
      }
      get_monthly_summaries_for_ai: {
        Args: { months_back?: number }
        Returns: {
          expense_trend: string
          income_trend: string
          mom_expense_change: number
          mom_income_change: number
          mom_profit_change: number
          month: number
          profit: number
          profit_margin: number
          profit_trend: string
          total_expense: number
          total_income: number
          transaction_count: number
          year: number
        }[]
      }
      is_date_range_cached: {
        Args: { p_end_date: string; p_source: string; p_start_date: string }
        Returns: {
          is_cached: boolean
          is_partial: boolean
          missing_end_date: string
          missing_start_date: string
          segments_found: number
        }[]
      }
      is_month_cached: {
        Args: { p_month: number; p_source: string; p_year: number }
        Returns: {
          is_cached: boolean
          transaction_count: number
        }[]
      }
      search_transactions_semantic: {
        Args: {
          limit_count?: number
          p_end_date?: string
          p_start_date?: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          amount: number
          category: string
          date: string
          description: string
          external_id: string
          id: string
          similarity: number
          source: string
          type: string
        }[]
      }
      update_transaction_embedding: {
        Args: { embedding: string; transaction_id: string }
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
