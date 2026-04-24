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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ao5_tensions: {
        Row: {
          alternative_reading: string
          best_use: string[]
          created_at: string
          dominant_reading: string
          focus: string
          id: string
          level_tag: string
          safe_stem: string
          updated_at: string
        }
        Insert: {
          alternative_reading: string
          best_use?: string[]
          created_at?: string
          dominant_reading: string
          focus: string
          id: string
          level_tag: string
          safe_stem: string
          updated_at?: string
        }
        Update: {
          alternative_reading?: string
          best_use?: string[]
          created_at?: string
          dominant_reading?: string
          focus?: string
          id?: string
          level_tag?: string
          safe_stem?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_cards: {
        Row: {
          common_misreading: string | null
          comparative_link: string | null
          complication: string | null
          core_function: string | null
          created_at: string
          id: string
          name: string
          one_line: string
          source_text: string
          structural_role: string | null
          themes: string[]
          updated_at: string
        }
        Insert: {
          common_misreading?: string | null
          comparative_link?: string | null
          complication?: string | null
          core_function?: string | null
          created_at?: string
          id: string
          name: string
          one_line: string
          source_text: string
          structural_role?: string | null
          themes?: string[]
          updated_at?: string
        }
        Update: {
          common_misreading?: string | null
          comparative_link?: string | null
          complication?: string | null
          core_function?: string | null
          created_at?: string
          id?: string
          name?: string
          one_line?: string
          source_text?: string
          structural_role?: string | null
          themes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      comparative_matrix: {
        Row: {
          atonement: string
          axis: string
          created_at: string
          divergence: string
          hard_times: string
          id: string
          themes: string[]
          updated_at: string
        }
        Insert: {
          atonement: string
          axis: string
          created_at?: string
          divergence: string
          hard_times: string
          id: string
          themes?: string[]
          updated_at?: string
        }
        Update: {
          atonement?: string
          axis?: string
          created_at?: string
          divergence?: string
          hard_times?: string
          id?: string
          themes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      essay_plans: {
        Row: {
          ao5_enabled: boolean
          builder_handoffs: Json
          client_plan_id: string | null
          created_at: string
          family: string | null
          id: string
          is_current: boolean
          notes: string | null
          paragraph_cards: Json
          question_id: string | null
          route_id: string | null
          selected_ao5_ids: Json
          selected_quote_ids: Json
          thesis_id: string | null
          thesis_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ao5_enabled?: boolean
          builder_handoffs?: Json
          client_plan_id?: string | null
          created_at?: string
          family?: string | null
          id?: string
          is_current?: boolean
          notes?: string | null
          paragraph_cards?: Json
          question_id?: string | null
          route_id?: string | null
          selected_ao5_ids?: Json
          selected_quote_ids?: Json
          thesis_id?: string | null
          thesis_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ao5_enabled?: boolean
          builder_handoffs?: Json
          client_plan_id?: string | null
          created_at?: string
          family?: string | null
          id?: string
          is_current?: boolean
          notes?: string | null
          paragraph_cards?: Json
          question_id?: string | null
          route_id?: string | null
          selected_ao5_ids?: Json
          selected_quote_ids?: Json
          thesis_id?: string | null
          thesis_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string
          dataset: string
          error_count: number
          errors: Json | null
          filename: string | null
          id: string
          imported_by: string | null
          inserted_count: number
          skipped_count: number
          updated_count: number
        }
        Insert: {
          created_at?: string
          dataset: string
          error_count?: number
          errors?: Json | null
          filename?: string | null
          id?: string
          imported_by?: string | null
          inserted_count?: number
          skipped_count?: number
          updated_count?: number
        }
        Update: {
          created_at?: string
          dataset?: string
          error_count?: number
          errors?: Json | null
          filename?: string | null
          id?: string
          imported_by?: string | null
          inserted_count?: number
          skipped_count?: number
          updated_count?: number
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_viewed_at: string
          lesson_id: string
          progress_pct: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          lesson_id: string
          progress_pct?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          lesson_id?: string
          progress_pct?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body: string | null
          created_at: string
          estimated_minutes: number | null
          id: string
          module_id: string
          position: number
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          module_id: string
          position?: number
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          module_id?: string
          position?: number
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          id: string
          position: number
          published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      paragraph_jobs: {
        Row: {
          created_at: string
          divergence_prompt: string
          id: string
          job_title: string
          judgement_prompt: string
          question_family: string
          route_id: string
          text1_prompt: string
          text2_prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          divergence_prompt: string
          id: string
          job_title: string
          judgement_prompt: string
          question_family: string
          route_id: string
          text1_prompt: string
          text2_prompt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          divergence_prompt?: string
          id?: string
          job_title?: string
          judgement_prompt?: string
          question_family?: string
          route_id?: string
          text1_prompt?: string
          text2_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paragraph_jobs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          school_year: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          school_year?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          school_year?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          family: string
          id: string
          level_tag: string
          likely_core_methods: string[]
          primary_route_id: string
          secondary_route_id: string
          stem: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family: string
          id: string
          level_tag: string
          likely_core_methods?: string[]
          primary_route_id: string
          secondary_route_id: string
          stem: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family?: string
          id?: string
          level_tag?: string
          likely_core_methods?: string[]
          primary_route_id?: string
          secondary_route_id?: string
          stem?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_primary_route_id_fkey"
            columns: ["primary_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_secondary_route_id_fkey"
            columns: ["secondary_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_methods: {
        Row: {
          best_themes: string[]
          created_at: string
          effect_prompt: string
          id: string
          level_tag: string
          meaning_prompt: string
          method: string
          quote_text: string
          source_text: string
          updated_at: string
        }
        Insert: {
          best_themes?: string[]
          created_at?: string
          effect_prompt: string
          id: string
          level_tag: string
          meaning_prompt: string
          method: string
          quote_text: string
          source_text: string
          updated_at?: string
        }
        Update: {
          best_themes?: string[]
          created_at?: string
          effect_prompt?: string
          id?: string
          level_tag?: string
          meaning_prompt?: string
          method?: string
          quote_text?: string
          source_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      reflection_entries: {
        Row: {
          checklist: Json
          created_at: string
          device_id: string | null
          first_failure_point: string | null
          id: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          checklist?: Json
          created_at?: string
          device_id?: string | null
          first_failure_point?: string | null
          id?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          checklist?: Json
          created_at?: string
          device_id?: string | null
          first_failure_point?: string | null
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "timed_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          module_id: string | null
          position: number
          published: boolean
          resource_type: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          position?: number
          published?: boolean
          resource_type?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          position?: number
          published?: boolean
          resource_type?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          atonement_emphasis: string
          best_use: string
          comparative_insight: string
          core_question: string
          created_at: string
          hard_times_emphasis: string
          id: string
          level_tag: string
          name: string
          updated_at: string
        }
        Insert: {
          atonement_emphasis: string
          best_use: string
          comparative_insight: string
          core_question: string
          created_at?: string
          hard_times_emphasis: string
          id: string
          level_tag: string
          name: string
          updated_at?: string
        }
        Update: {
          atonement_emphasis?: string
          best_use?: string
          comparative_insight?: string
          core_question?: string
          created_at?: string
          hard_times_emphasis?: string
          id?: string
          level_tag?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_essay_plans: {
        Row: {
          ao5_enabled: boolean
          created_at: string
          device_id: string | null
          family: string | null
          id: string
          paragraph_cards: Json
          paragraph_job_ids: string[]
          question_id: string | null
          route_id: string | null
          selected_ao5_ids: string[]
          selected_quote_ids: string[]
          thesis_id: string | null
          thesis_level: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ao5_enabled?: boolean
          created_at?: string
          device_id?: string | null
          family?: string | null
          id?: string
          paragraph_cards?: Json
          paragraph_job_ids?: string[]
          question_id?: string | null
          route_id?: string | null
          selected_ao5_ids?: string[]
          selected_quote_ids?: string[]
          thesis_id?: string | null
          thesis_level?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ao5_enabled?: boolean
          created_at?: string
          device_id?: string | null
          family?: string | null
          id?: string
          paragraph_cards?: Json
          paragraph_job_ids?: string[]
          question_id?: string | null
          route_id?: string | null
          selected_ao5_ids?: string[]
          selected_quote_ids?: string[]
          thesis_id?: string | null
          thesis_level?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string
          dataset: string
          from: string
          id: string
          is_default: boolean
          name: string
          q: string
          to: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset?: string
          from?: string
          id?: string
          is_default?: boolean
          name: string
          q?: string
          to?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset?: string
          from?: string
          id?: string
          is_default?: boolean
          name?: string
          q?: string
          to?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staged_changes: {
        Row: {
          apply_error: string | null
          changed_fields: string[]
          created_at: string
          id: string
          note: string | null
          original_snapshot: Json
          proposal_type: string
          proposed_at: string
          proposed_by: string | null
          proposed_patch: Json
          reviewed_at: string | null
          reviewed_by: string | null
          source_finding_id: string | null
          source_issue_type: string | null
          source_surface: string | null
          status: string
          target_record_id: string
          target_table: string
          updated_at: string
        }
        Insert: {
          apply_error?: string | null
          changed_fields?: string[]
          created_at?: string
          id?: string
          note?: string | null
          original_snapshot?: Json
          proposal_type?: string
          proposed_at?: string
          proposed_by?: string | null
          proposed_patch?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_finding_id?: string | null
          source_issue_type?: string | null
          source_surface?: string | null
          status?: string
          target_record_id: string
          target_table: string
          updated_at?: string
        }
        Update: {
          apply_error?: string | null
          changed_fields?: string[]
          created_at?: string
          id?: string
          note?: string | null
          original_snapshot?: Json
          proposal_type?: string
          proposed_at?: string
          proposed_by?: string | null
          proposed_patch?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_finding_id?: string | null
          source_issue_type?: string | null
          source_surface?: string | null
          status?: string
          target_record_id?: string
          target_table?: string
          updated_at?: string
        }
        Relationships: []
      }
      symbol_entries: {
        Row: {
          created_at: string
          id: string
          name: string
          one_line: string
          source_text: string
          themes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          one_line: string
          source_text: string
          themes?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          one_line?: string
          source_text?: string
          themes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      theme_maps: {
        Row: {
          created_at: string
          family: string
          id: string
          one_line: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family: string
          id: string
          one_line: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family?: string
          id?: string
          one_line?: string
          updated_at?: string
        }
        Relationships: []
      }
      theses: {
        Row: {
          created_at: string
          id: string
          level: string
          paragraph_job_1_label: string
          paragraph_job_2_label: string
          paragraph_job_3_label: string | null
          route_id: string
          theme_family: string
          thesis_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          level: string
          paragraph_job_1_label: string
          paragraph_job_2_label: string
          paragraph_job_3_label?: string | null
          route_id: string
          theme_family: string
          thesis_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          paragraph_job_1_label?: string
          paragraph_job_2_label?: string
          paragraph_job_3_label?: string | null
          route_id?: string
          theme_family?: string
          thesis_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theses_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      timed_sessions: {
        Row: {
          completed: boolean
          created_at: string
          device_id: string | null
          duration_minutes: number
          ended_at: string | null
          expired: boolean
          id: string
          mode_id: string
          plan_id: string | null
          response_text: string
          started_at: string
          updated_at: string
          user_id: string | null
          word_count: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          device_id?: string | null
          duration_minutes: number
          ended_at?: string | null
          expired?: boolean
          id?: string
          mode_id: string
          plan_id?: string | null
          response_text?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
          word_count?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          device_id?: string | null
          duration_minutes?: number
          ended_at?: string | null
          expired?: boolean
          id?: string
          mode_id?: string
          plan_id?: string | null
          response_text?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "timed_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saved_essay_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_emails: {
        Args: { _user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: {
        Args: { row_device_id: string; row_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
