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
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      gmail_connections: {
        Row: {
          id: string;
          user_id: string;
          google_subject: string;
          gmail_address: string;
          encrypted_access_token: string;
          encrypted_refresh_token: string;
          token_expiry: string | null;
          granted_scopes: string[];
          connected_at: string;
          last_synced_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      email_threads: {
        Row: {
          id: string;
          user_id: string;
          gmail_thread_id: string;
          subject: string;
          normalized_text: string | null;
          normalized_character_count: number;
          content_hash: string;
          content_trimmed: boolean;
          contains_potential_prompt_injection: boolean;
          messages: Json;
          has_attachments: boolean;
          gmail_labels: string[];
          latest_message_at: string;
          created_at: string;
          updated_at: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: string;
          priority: string;
          due_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
