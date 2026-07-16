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
          email_thread_id: string | null;
          email_analysis_id: string | null;
          source_message_id: string | null;
          source_action_key: string | null;
          source_evidence: string | null;
          title: string;
          description: string | null;
          source: string;
          status: string;
          priority: string;
          due_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      reply_drafts: {
        Row: {
          id: string;
          user_id: string;
          email_thread_id: string;
          email_analysis_id: string | null;
          thread_content_hash: string;
          prompt_version: string;
          schema_version: string;
          model: string;
          response_id: string | null;
          tone: string;
          length: string;
          instructions: string | null;
          instructions_hash: string;
          subject: string;
          body: string;
          confidence: number;
          used_facts: Json;
          uncertain_points: Json;
          warnings: Json;
          evidence: Json;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
