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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
          summary: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id: string
          summary: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          summary?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string | null
          request_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          request_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          request_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      backup_configurations: {
        Row: {
          client_id: string | null
          created_at: string
          deleted_at: string | null
          frequency: string
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          organization_id: string
          project_id: string | null
          provider_name: string
          retention_days: number
          status: Database["public"]["Enums"]["backup_status"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          organization_id: string
          project_id?: string | null
          provider_name: string
          retention_days?: number
          status?: Database["public"]["Enums"]["backup_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          project_id?: string | null
          provider_name?: string
          retention_days?: number
          status?: Database["public"]["Enums"]["backup_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_configurations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_configurations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "backup_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "backup_configurations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_records: {
        Row: {
          backup_configuration_id: string
          checksum: string | null
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json
          size_bytes: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"]
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          backup_configuration_id: string
          checksum?: string | null
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          size_bytes?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          backup_configuration_id?: string
          checksum?: string | null
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          size_bytes?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_records_backup_configuration_id_fkey"
            columns: ["backup_configuration_id"]
            isOneToOne: false
            referencedRelation: "backup_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          job_title: string | null
          mobile: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          receives_billing: boolean
          receives_support: boolean
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          receives_billing?: boolean
          receives_support?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          receives_billing?: boolean
          receives_support?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      client_portal_access: {
        Row: {
          can_create_tickets: boolean
          can_view_documents: boolean
          can_view_invoices: boolean
          can_view_projects: boolean
          client_id: string
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          can_create_tickets?: boolean
          can_view_documents?: boolean
          can_view_invoices?: boolean
          can_view_projects?: boolean
          client_id: string
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          can_create_tickets?: boolean
          can_view_documents?: boolean
          can_view_invoices?: boolean
          can_view_projects?: boolean
          client_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_portal_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      client_services: {
        Row: {
          auto_renew: boolean
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at: string
          currency_code: string
          deleted_at: string | null
          ends_on: string | null
          id: string
          interval_count: number
          name_override: string | null
          next_billing_date: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          quantity: number
          service_id: string
          starts_on: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          supplier_cost: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          ends_on?: string | null
          id?: string
          interval_count?: number
          name_override?: string | null
          next_billing_date?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          quantity?: number
          service_id: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          supplier_cost?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          ends_on?: string | null
          id?: string
          interval_count?: number
          name_override?: string | null
          next_billing_date?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          quantity?: number
          service_id?: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          supplier_cost?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "client_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_name: string
          email: string | null
          id: string
          legal_name: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          preferred_language: string
          region: string | null
          source: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name: string
          email?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string
          region?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string
          region?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      credential_access_logs: {
        Row: {
          action: Database["public"]["Enums"]["credential_access_action"]
          created_at: string
          credential_id: string
          id: string
          ip: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["credential_access_action"]
          created_at?: string
          credential_id: string
          id?: string
          ip?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["credential_access_action"]
          created_at?: string
          credential_id?: string
          id?: string
          ip?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_access_logs_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          domain_id: string | null
          email_account_id: string | null
          expires_at: string | null
          hosting_account_id: string | null
          id: string
          is_shared_with_client: boolean
          label: string
          last_verified_at: string | null
          login_url: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          secret_reference: string | null
          type: Database["public"]["Enums"]["credential_type"]
          updated_at: string
          updated_by: string | null
          username: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          domain_id?: string | null
          email_account_id?: string | null
          expires_at?: string | null
          hosting_account_id?: string | null
          id?: string
          is_shared_with_client?: boolean
          label: string
          last_verified_at?: string | null
          login_url?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          secret_reference?: string | null
          type: Database["public"]["Enums"]["credential_type"]
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          domain_id?: string | null
          email_account_id?: string | null
          expires_at?: string | null
          hosting_account_id?: string | null
          id?: string
          is_shared_with_client?: boolean
          label?: string
          last_verified_at?: string | null
          login_url?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          secret_reference?: string | null
          type?: Database["public"]["Enums"]["credential_type"]
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credentials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "credentials_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_hosting_account_id_fkey"
            columns: ["hosting_account_id"]
            isOneToOne: false
            referencedRelation: "hosting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          bucket_id: string
          category: Database["public"]["Enums"]["document_category"]
          checksum: string | null
          client_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          invoice_id: string | null
          is_visible_to_client: boolean
          mime_type: string | null
          organization_id: string
          original_filename: string | null
          project_id: string | null
          quote_id: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket_id: string
          category?: Database["public"]["Enums"]["document_category"]
          checksum?: string | null
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          is_visible_to_client?: boolean
          mime_type?: string | null
          organization_id: string
          original_filename?: string | null
          project_id?: string | null
          quote_id?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          category?: Database["public"]["Enums"]["document_category"]
          checksum?: string | null
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          is_visible_to_client?: boolean
          mime_type?: string | null
          organization_id?: string
          original_filename?: string | null
          project_id?: string | null
          quote_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          auto_renew: boolean
          client_id: string
          created_at: string
          currency_code: string
          deleted_at: string | null
          domain_name: string
          expires_on: string | null
          id: string
          managed_by_us: boolean
          nameservers: string[]
          notes: string | null
          organization_id: string
          privacy_enabled: boolean
          project_id: string | null
          registered_on: string | null
          registrar_account_reference: string | null
          registrar_name: string | null
          renewal_price: number | null
          status: Database["public"]["Enums"]["domain_status"]
          transfer_lock_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          client_id: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          domain_name: string
          expires_on?: string | null
          id?: string
          managed_by_us?: boolean
          nameservers?: string[]
          notes?: string | null
          organization_id: string
          privacy_enabled?: boolean
          project_id?: string | null
          registered_on?: string | null
          registrar_account_reference?: string | null
          registrar_name?: string | null
          renewal_price?: number | null
          status?: Database["public"]["Enums"]["domain_status"]
          transfer_lock_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          client_id?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          domain_name?: string
          expires_on?: string | null
          id?: string
          managed_by_us?: boolean
          nameservers?: string[]
          notes?: string | null
          organization_id?: string
          privacy_enabled?: boolean
          project_id?: string | null
          registered_on?: string | null
          registrar_account_reference?: string | null
          registrar_name?: string | null
          renewal_price?: number | null
          status?: Database["public"]["Enums"]["domain_status"]
          transfer_lock_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          address: string
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email_service_id: string
          forwards_to: string[]
          id: string
          notes: string | null
          organization_id: string
          quota_mb: number | null
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email_service_id: string
          forwards_to?: string[]
          id?: string
          notes?: string | null
          organization_id: string
          quota_mb?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email_service_id?: string
          forwards_to?: string[]
          id?: string
          notes?: string | null
          organization_id?: string
          quota_mb?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_email_service_id_fkey"
            columns: ["email_service_id"]
            isOneToOne: false
            referencedRelation: "email_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      email_messages: {
        Row: {
          bcc_addresses: string[]
          body: string | null
          cc_addresses: string[]
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          organization_id: string
          provider: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          status: string
          subject: string
          to_addresses: string[]
          updated_at: string
        }
        Insert: {
          bcc_addresses?: string[]
          body?: string | null
          cc_addresses?: string[]
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id: string
          provider?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_addresses: string[]
          updated_at?: string
        }
        Update: {
          bcc_addresses?: string[]
          body?: string | null
          cc_addresses?: string[]
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          provider?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_addresses?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "email_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      email_services: {
        Row: {
          auto_renew: boolean
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at: string
          currency_code: string
          deleted_at: string | null
          domain_id: string | null
          expires_on: string | null
          id: string
          notes: string | null
          organization_id: string
          plan_name: string | null
          project_id: string | null
          provider_name: string
          renewal_price: number | null
          starts_on: string | null
          status: Database["public"]["Enums"]["hosting_status"]
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          domain_id?: string | null
          expires_on?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          plan_name?: string | null
          project_id?: string | null
          provider_name: string
          renewal_price?: number | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["hosting_status"]
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          domain_id?: string | null
          expires_on?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          plan_name?: string | null
          project_id?: string | null
          provider_name?: string
          renewal_price?: number | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["hosting_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "email_services_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "email_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_accounts: {
        Row: {
          auto_renew: boolean
          bandwidth_limit_mb: number | null
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at: string
          currency_code: string
          deleted_at: string | null
          expires_on: string | null
          id: string
          notes: string | null
          organization_id: string
          panel_url: string | null
          plan_name: string | null
          project_id: string | null
          provider_name: string
          renewal_price: number | null
          server_hostname: string | null
          server_ip: unknown
          starts_on: string | null
          status: Database["public"]["Enums"]["hosting_status"]
          storage_limit_mb: number | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          bandwidth_limit_mb?: number | null
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          expires_on?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          panel_url?: string | null
          plan_name?: string | null
          project_id?: string | null
          provider_name: string
          renewal_price?: number | null
          server_hostname?: string | null
          server_ip?: unknown
          starts_on?: string | null
          status?: Database["public"]["Enums"]["hosting_status"]
          storage_limit_mb?: number | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          bandwidth_limit_mb?: number | null
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          expires_on?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          panel_url?: string | null
          plan_name?: string | null
          project_id?: string | null
          provider_name?: string
          renewal_price?: number | null
          server_hostname?: string | null
          server_ip?: unknown
          starts_on?: string | null
          status?: Database["public"]["Enums"]["hosting_status"]
          storage_limit_mb?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "hosting_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "hosting_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount_percent: number
          id: string
          invoice_id: string
          line_subtotal: number | null
          line_tax: number | null
          line_total: number | null
          position: number
          quantity: number
          service_id: string | null
          tax_rate: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number
          id?: string
          invoice_id: string
          line_subtotal?: number | null
          line_tax?: number | null
          line_total?: number | null
          position?: number
          quantity?: number
          service_id?: string | null
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          invoice_id?: string
          line_subtotal?: number | null
          line_tax?: number | null
          line_total?: number | null
          position?: number
          quantity?: number
          service_id?: string | null
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          client_id: string
          created_at: string
          created_by: string | null
          currency_code: string
          discount_amount: number
          due_date: string | null
          external_id: string | null
          external_provider: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          project_id: string | null
          quote_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          updated_by: string | null
          viewed_at: string | null
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          discount_amount?: number
          due_date?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          project_id?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          updated_by?: string | null
          viewed_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          discount_amount?: number
          due_date?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          project_id?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          updated_by?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_id: string
          provider: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id: string
          provider?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string
          provider?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          expires_at: string | null
          id: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          key: string
          organization_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          organization_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          organization_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country_code: string
          created_at: string
          currency_code: string
          deleted_at: string | null
          email: string | null
          id: string
          legal_name: string | null
          logo_path: string | null
          name: string
          phone: string | null
          postal_code: string | null
          region: string | null
          settings: Json
          slug: string
          tax_id: string | null
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          settings?: Json
          slug: string
          tax_id?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          settings?: Json
          slug?: string
          tax_id?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          currency_code: string
          external_id: string | null
          external_provider: string | null
          failure_reason: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_type"]
          organization_id: string
          paid_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          currency_code?: string
          external_id?: string | null
          external_provider?: string | null
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_type"]
          organization_id: string
          paid_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          currency_code?: string
          external_id?: string | null
          external_provider?: string | null
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_type"]
          organization_id?: string
          paid_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          last_seen_at: string | null
          locale: string
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_to: string | null
          budget: number | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          production_url: string | null
          progress_percent: number
          repository_url: string | null
          slug: string
          staging_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_date: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          production_url?: string | null
          progress_percent?: number
          repository_url?: string | null
          slug: string
          staging_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          production_url?: string | null
          progress_percent?: number
          repository_url?: string | null
          slug?: string
          staging_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          discount_percent: number
          id: string
          line_subtotal: number | null
          line_tax: number | null
          line_total: number | null
          position: number
          quantity: number
          quote_id: string
          service_id: string | null
          tax_rate: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number
          id?: string
          line_subtotal?: number | null
          line_tax?: number | null
          line_total?: number | null
          position?: number
          quantity?: number
          quote_id: string
          service_id?: string | null
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          line_subtotal?: number | null
          line_tax?: number | null
          line_total?: number | null
          position?: number
          quantity?: number
          quote_id?: string
          service_id?: string | null
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_id: string
          created_at: string
          created_by: string | null
          currency_code: string
          deleted_at: string | null
          discount_amount: number
          id: string
          issue_date: string
          notes: string | null
          organization_id: string
          project_id: string | null
          quote_number: string
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          tax_amount: number
          terms: string | null
          total: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          deleted_at?: string | null
          discount_amount?: number
          id?: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          quote_number: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          deleted_at?: string | null
          discount_amount?: number
          id?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          quote_number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          last_value: number
          organization_id: string
          sequence_type: string
          sequence_year: number
          updated_at: string
        }
        Insert: {
          last_value?: number
          organization_id: string
          sequence_type: string
          sequence_year: number
          updated_at?: string
        }
        Update: {
          last_value?: number
          organization_id?: string
          sequence_type?: string
          sequence_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      services: {
        Row: {
          billing_type: Database["public"]["Enums"]["service_billing_type"]
          category: Database["public"]["Enums"]["service_category"]
          code: string
          created_at: string
          currency_code: string
          default_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          default_price: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          tax_rate: number
          updated_at: string
        }
        Insert: {
          billing_type: Database["public"]["Enums"]["service_billing_type"]
          category: Database["public"]["Enums"]["service_category"]
          code: string
          created_at?: string
          currency_code?: string
          default_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["service_billing_type"]
          category?: Database["public"]["Enums"]["service_category"]
          code?: string
          created_at?: string
          currency_code?: string
          default_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          tax_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancel_at: string | null
          cancelled_at: string | null
          client_id: string
          client_service_id: string | null
          created_at: string
          currency_code: string
          current_period_end: string | null
          current_period_start: string | null
          external_id: string | null
          external_provider: string | null
          id: string
          organization_id: string
          service_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at?: string | null
          cancelled_at?: string | null
          client_id: string
          client_service_id?: string | null
          created_at?: string
          currency_code?: string
          current_period_end?: string | null
          current_period_start?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          organization_id: string
          service_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at?: string | null
          cancelled_at?: string | null
          client_id?: string
          client_service_id?: string | null
          created_at?: string
          currency_code?: string
          current_period_end?: string | null
          current_period_start?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          organization_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "subscriptions_client_service_id_fkey"
            columns: ["client_service_id"]
            isOneToOne: false
            referencedRelation: "client_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "subscriptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_internal: boolean
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_internal?: boolean
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_internal?: boolean
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          organization_id: string
          parent_task_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          organization_id: string
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          organization_id?: string
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          author_contact_id: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
          updated_at: string
        }
        Insert: {
          author_contact_id?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
          updated_at?: string
        }
        Update: {
          author_contact_id?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_contact_id_fkey"
            columns: ["author_contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          client_id: string
          closed_at: string | null
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          first_response_at: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string | null
          requester_user_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_client_summary: {
        Row: {
          client_id: string | null
          display_name: string | null
          open_ticket_count: number | null
          organization_id: string | null
          project_count: number | null
          status: Database["public"]["Enums"]["client_status"] | null
          total_invoiced: number | null
          total_outstanding: number | null
          total_paid: number | null
        }
        Insert: {
          client_id?: string | null
          display_name?: string | null
          open_ticket_count?: never
          organization_id?: string | null
          project_count?: never
          status?: Database["public"]["Enums"]["client_status"] | null
          total_invoiced?: never
          total_outstanding?: never
          total_paid?: never
        }
        Update: {
          client_id?: string | null
          display_name?: string | null
          open_ticket_count?: never
          organization_id?: string | null
          project_count?: never
          status?: Database["public"]["Enums"]["client_status"] | null
          total_invoiced?: never
          total_outstanding?: never
          total_paid?: never
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_metrics: {
        Row: {
          active_clients: number | null
          active_projects: number | null
          domains_expiring_30d: number | null
          open_tasks: number | null
          open_tickets: number | null
          organization_id: string | null
          outstanding_amount: number | null
        }
        Insert: {
          active_clients?: never
          active_projects?: never
          domains_expiring_30d?: never
          open_tasks?: never
          open_tickets?: never
          organization_id?: string | null
          outstanding_amount?: never
        }
        Update: {
          active_clients?: never
          active_projects?: never
          domains_expiring_30d?: never
          open_tasks?: never
          open_tickets?: never
          organization_id?: string | null
          outstanding_amount?: never
        }
        Relationships: []
      }
      v_invoice_balances: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          client_id: string | null
          client_name: string | null
          currency_code: string | null
          due_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_upcoming_renewals: {
        Row: {
          client_id: string | null
          entity_id: string | null
          entity_type: string | null
          expires_on: string | null
          organization_id: string | null
          reference: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_client: { Args: { client_id: string }; Returns: boolean }
      has_organization_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["organization_role"][]
          org_id: string
        }
        Returns: boolean
      }
      is_organization_member: { Args: { org_id: string }; Returns: boolean }
      next_sequence_value: {
        Args: { org_id: string; seq_type: string; seq_year: number }
        Returns: number
      }
      recalculate_invoice_payment_state: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      recalculate_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      recalculate_quote_totals: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
    }
    Enums: {
      backup_status:
        | "pending"
        | "running"
        | "successful"
        | "failed"
        | "cancelled"
      billing_interval:
        | "weekly"
        | "monthly"
        | "quarterly"
        | "semiannual"
        | "annual"
        | "biennial"
        | "custom"
      client_status: "lead" | "prospect" | "active" | "inactive" | "archived"
      client_type: "individual" | "company" | "association" | "other"
      credential_access_action: "view" | "copy" | "update" | "rotate"
      credential_type:
        | "website_admin"
        | "hosting_panel"
        | "domain_registrar"
        | "ftp"
        | "sftp"
        | "ssh"
        | "database"
        | "email"
        | "api"
        | "social_media"
        | "analytics"
        | "other"
      document_category:
        | "contract"
        | "quote"
        | "invoice"
        | "receipt"
        | "brief"
        | "report"
        | "credential_export"
        | "legal"
        | "other"
      domain_status:
        | "pending"
        | "active"
        | "expired"
        | "transferred"
        | "cancelled"
        | "unknown"
      hosting_status:
        | "pending"
        | "active"
        | "suspended"
        | "expired"
        | "cancelled"
      invoice_status:
        | "draft"
        | "issued"
        | "sent"
        | "viewed"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "void"
        | "refunded"
      membership_status: "invited" | "active" | "suspended" | "revoked"
      notification_channel: "in_app" | "email" | "push" | "webhook"
      notification_type:
        | "system"
        | "renewal"
        | "payment"
        | "invoice"
        | "task"
        | "ticket"
        | "backup"
        | "security"
        | "other"
      organization_role:
        | "owner"
        | "admin"
        | "manager"
        | "member"
        | "viewer"
        | "client"
      payment_method_type:
        | "bank_transfer"
        | "card"
        | "cash"
        | "paypal"
        | "stripe"
        | "direct_debit"
        | "other"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      project_status:
        | "draft"
        | "planned"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "archived"
      project_type:
        | "website"
        | "ecommerce"
        | "landing_page"
        | "maintenance"
        | "redesign"
        | "seo"
        | "consulting"
        | "other"
      quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      service_billing_type: "one_time" | "recurring" | "usage_based" | "free"
      service_category:
        | "development"
        | "design"
        | "hosting"
        | "domain"
        | "email"
        | "maintenance"
        | "seo"
        | "analytics"
        | "support"
        | "consulting"
        | "other"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "cancelled"
        | "expired"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "blocked"
        | "review"
        | "done"
        | "cancelled"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_client"
        | "waiting_internal"
        | "resolved"
        | "closed"
        | "cancelled"
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
      backup_status: [
        "pending",
        "running",
        "successful",
        "failed",
        "cancelled",
      ],
      billing_interval: [
        "weekly",
        "monthly",
        "quarterly",
        "semiannual",
        "annual",
        "biennial",
        "custom",
      ],
      client_status: ["lead", "prospect", "active", "inactive", "archived"],
      client_type: ["individual", "company", "association", "other"],
      credential_access_action: ["view", "copy", "update", "rotate"],
      credential_type: [
        "website_admin",
        "hosting_panel",
        "domain_registrar",
        "ftp",
        "sftp",
        "ssh",
        "database",
        "email",
        "api",
        "social_media",
        "analytics",
        "other",
      ],
      document_category: [
        "contract",
        "quote",
        "invoice",
        "receipt",
        "brief",
        "report",
        "credential_export",
        "legal",
        "other",
      ],
      domain_status: [
        "pending",
        "active",
        "expired",
        "transferred",
        "cancelled",
        "unknown",
      ],
      hosting_status: [
        "pending",
        "active",
        "suspended",
        "expired",
        "cancelled",
      ],
      invoice_status: [
        "draft",
        "issued",
        "sent",
        "viewed",
        "partially_paid",
        "paid",
        "overdue",
        "void",
        "refunded",
      ],
      membership_status: ["invited", "active", "suspended", "revoked"],
      notification_channel: ["in_app", "email", "push", "webhook"],
      notification_type: [
        "system",
        "renewal",
        "payment",
        "invoice",
        "task",
        "ticket",
        "backup",
        "security",
        "other",
      ],
      organization_role: [
        "owner",
        "admin",
        "manager",
        "member",
        "viewer",
        "client",
      ],
      payment_method_type: [
        "bank_transfer",
        "card",
        "cash",
        "paypal",
        "stripe",
        "direct_debit",
        "other",
      ],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      project_status: [
        "draft",
        "planned",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "archived",
      ],
      project_type: [
        "website",
        "ecommerce",
        "landing_page",
        "maintenance",
        "redesign",
        "seo",
        "consulting",
        "other",
      ],
      quote_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ],
      service_billing_type: ["one_time", "recurring", "usage_based", "free"],
      service_category: [
        "development",
        "design",
        "hosting",
        "domain",
        "email",
        "maintenance",
        "seo",
        "analytics",
        "support",
        "consulting",
        "other",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "paused",
        "cancelled",
        "expired",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "backlog",
        "todo",
        "in_progress",
        "blocked",
        "review",
        "done",
        "cancelled",
      ],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_client",
        "waiting_internal",
        "resolved",
        "closed",
        "cancelled",
      ],
    },
  },
} as const
