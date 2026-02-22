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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
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
