export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          name: string
          email: string
          slot: string | null
          day: string | null
          time: string | null
          type: 'In-person' | 'Remote' | null
          salary: string | null
          notice: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['candidates']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>
      }
      candidate_profiles: {
        Row: {
          candidate_id: string
          title: string | null
          company: string | null
          summary: string | null
          strengths: string[] | null
          weaknesses: string[] | null
          fit_score: number | null
          fit_label: string | null
          fit_color: string | null
          ai_score: number | null
          fintech_score: number | null
          b2b_score: number | null
          seniority_score: number | null
          custom_questions: string[] | null
          watch_for: string | null
          career: Json
        }
        Insert: Database['public']['Tables']['candidate_profiles']['Row']
        Update: Partial<Database['public']['Tables']['candidate_profiles']['Insert']>
      }
      candidate_analysis: {
        Row: {
          candidate_id: string
          university: string | null
          degree: string | null
          grad_year: number | null
          masters: string | null
          total_exp: number | null
          pm_exp: number | null
          current_role: string | null
          current_company: string | null
          domains: string[] | null
          ai_exp: boolean
          b2b: boolean
          b2c: boolean
          fintech: boolean
          notable: string | null
        }
        Insert: Database['public']['Tables']['candidate_analysis']['Row']
        Update: Partial<Database['public']['Tables']['candidate_analysis']['Insert']>
      }
      interview_state: {
        Row: {
          candidate_id: string
          confirmed: boolean
          shortlisted: boolean | null
          interview_status: 'pending' | 'in-progress' | 'completed'
          verdict: 'strong-yes' | 'yes' | 'maybe' | 'no' | null
          peter_scores: Json
          ossama_scores: Json
          peter_comment: string
          ossama_comment: string
          checklist: Json
          photo_url: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['interview_state']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['interview_state']['Insert']>
      }
      interview_questions: {
        Row: {
          id: number
          position: number
          title: string
          duration: string | null
          goal: string | null
          color: string | null
          bg: string | null
          questions: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['interview_questions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['interview_questions']['Insert']>
      }
      app_config: {
        Row: { key: string; value: string; description: string | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['app_config']['Row'], 'updated_at'>
        Update: Partial<Pick<Database['public']['Tables']['app_config']['Row'], 'value'>>
      }
      scores: {
        Row: {
          id: number
          candidate_id: string
          user_id: string
          category: string
          value: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['scores']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Pick<Database['public']['Tables']['scores']['Row'], 'value'>>
      }
      candidate_comments: {
        Row: {
          id: number
          candidate_id: string
          user_id: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['candidate_comments']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Pick<Database['public']['Tables']['candidate_comments']['Row'], 'body'>>
      }
      hiring_rounds: {
        Row: {
          id: number
          name: string
          role: string
          role_short: string
          start_date: string
          end_date: string
          score_categories: string[]
          checklist_items: string[]
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hiring_rounds']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hiring_rounds']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          title: string | null
          avatar_url: string | null
          scorer_slot: 'peter' | 'ossama' | null
          theme: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      audit_log: {
        Row: {
          id: number
          candidate_id: string | null
          changed_by: string
          field: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
