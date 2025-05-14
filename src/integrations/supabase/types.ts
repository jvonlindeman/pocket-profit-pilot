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
          external_id: string
          fees: number | null
          fetched_at: string | null
          gross: number | null
          id: string
          metadata: Json | null
          source: string
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          external_id: string
          fees?: number | null
          fetched_at?: string | null
          gross?: number | null
          id?: string
          metadata?: Json | null
          source: string
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          external_id?: string
          fees?: number | null
          fetched_at?: string | null
          gross?: number | null
          id?: string
          metadata?: Json | null
          source?: string
          type?: string
        }
        Relationships: []
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
