export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          is_shared: boolean | null;
          share_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          is_shared?: boolean | null;
          share_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          is_shared?: boolean | null;
          share_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
        knowledge_map: {
          Row: {
            id: string;
            user_id: string;
            subject: string;
            topic: string;
            interactions_count: number | null;
            mastery_score: number | null;
            last_interaction_at: string | null;
            created_at: string | null;
          };
          Insert: {
            id?: string;
            user_id: string;
            subject: string;
            topic: string;
            interactions_count?: number | null;
            mastery_score?: number | null;
            last_interaction_at?: string | null;
            created_at?: string | null;
          };
          Update: {
            id?: string;
            user_id?: string;
            subject?: string;
            topic?: string;
            interactions_count?: number | null;
            mastery_score?: number | null;
            last_interaction_at?: string | null;
            created_at?: string | null;
          };
        };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_streak: number | null;
          last_active_date: string | null;
          badges: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_streak?: number | null;
          last_active_date?: string | null;
          badges?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_streak?: number | null;
          last_active_date?: string | null;
          badges?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          solves: number;
          writes: number;
          humanizes: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          solves?: number;
          writes?: number;
          humanizes?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          solves?: number;
          writes?: number;
          humanizes?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
