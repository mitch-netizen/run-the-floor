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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approver_role_id: string | null
          archived_at: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string
          id: string
          note: string | null
          organisation_id: string
          requested_by: string
          subject_id: string | null
          subject_type: string
          summary: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          approver_role_id?: string | null
          archived_at?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          id?: string
          note?: string | null
          organisation_id: string
          requested_by?: string
          subject_id?: string | null
          subject_type: string
          summary: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          approver_role_id?: string | null
          archived_at?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          id?: string
          note?: string | null
          organisation_id?: string
          requested_by?: string
          subject_id?: string | null
          subject_type?: string
          summary?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_role_id_venue_id_fkey"
            columns: ["approver_role_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "approvals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          organisation_id: string | null
          record_id: string
          table_name: string
          venue_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          organisation_id?: string | null
          record_id: string
          table_name: string
          venue_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          organisation_id?: string | null
          record_id?: string
          table_name?: string
          venue_id?: string | null
        }
        Relationships: []
      }
      capabilities: {
        Row: {
          description: string
          key: string
        }
        Insert: {
          description: string
          key: string
        }
        Update: {
          description?: string
          key?: string
        }
        Relationships: []
      }
      checklist_runs: {
        Row: {
          archived_at: string | null
          area_id: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_at: string | null
          exception_count: number
          id: string
          late: boolean
          organisation_id: string
          shift_id: string | null
          started_at: string
          started_by: string | null
          status: string
          template_version_id: string
          trading_date: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at?: string | null
          exception_count?: number
          id?: string
          late?: boolean
          organisation_id: string
          shift_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          template_version_id: string
          trading_date: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at?: string | null
          exception_count?: number
          id?: string
          late?: boolean
          organisation_id?: string
          shift_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          template_version_id?: string
          trading_date?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_area_id_venue_id_fkey"
            columns: ["area_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "venue_areas"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_runs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_shift_id_venue_id_fkey"
            columns: ["shift_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_template_version_id_venue_id_fkey"
            columns: ["template_version_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_versions"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_runs_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      checklist_template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          due_offset: string | null
          id: string
          items: Json
          organisation_id: string
          published_at: string | null
          published_by: string | null
          template_id: string
          updated_at: string
          venue_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_offset?: string | null
          id?: string
          items?: Json
          organisation_id: string
          published_at?: string | null
          published_by?: string | null
          template_id: string
          updated_at?: string
          venue_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_offset?: string | null
          id?: string
          items?: Json
          organisation_id?: string
          published_at?: string | null
          published_by?: string | null
          template_id?: string
          updated_at?: string
          venue_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_template_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_template_versions_template_id_venue_id_fkey"
            columns: ["template_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_template_versions_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          archived_at: string | null
          area_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          name: string
          organisation_id: string
          shift_type_id: string | null
          source_import_batch_id: string | null
          source_key: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          name: string
          organisation_id: string
          shift_type_id?: string | null
          source_import_batch_id?: string | null
          source_key?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          name?: string
          organisation_id?: string
          shift_type_id?: string | null
          source_import_batch_id?: string | null
          source_key?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_area_id_venue_id_fkey"
            columns: ["area_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "venue_areas"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_templates_shift_type_id_venue_id_fkey"
            columns: ["shift_type_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shift_types"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_templates_source_import_batch_id_venue_id_fkey"
            columns: ["source_import_batch_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checklist_templates_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          active: boolean
          archived_at: string | null
          created_at: string
          id: string
          jurisdiction: string
          notes: string | null
          organisation_id: string
          params: Json
          rule_key: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          archived_at?: string | null
          created_at?: string
          id?: string
          jurisdiction: string
          notes?: string | null
          organisation_id: string
          params?: Json
          rule_key: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          archived_at?: string | null
          created_at?: string
          id?: string
          jurisdiction?: string
          notes?: string | null
          organisation_id?: string
          params?: Json
          rule_key?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          call_tree_order: number | null
          category: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organisation: string | null
          organisation_id: string
          phones: string[]
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          call_tree_order?: number | null
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organisation?: string | null
          organisation_id: string
          phones?: string[]
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          call_tree_order?: number | null
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organisation?: string | null
          organisation_id?: string
          phones?: string[]
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      departments: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          organisation_id: string
          owner_user_id: string | null
          sort: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          organisation_id: string
          owner_user_id?: string | null
          sort?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          organisation_id?: string
          owner_user_id?: string | null
          sort?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      events: {
        Row: {
          archived_at: string | null
          client_name: string | null
          contact: Json
          created_at: string
          created_by: string | null
          deposit_amount: number | null
          deposit_status: string | null
          ends_at: string | null
          event_date: string
          external_ref: string | null
          guest_numbers: number | null
          id: string
          organisation_id: string
          room: string | null
          source: string
          starts_at: string | null
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          client_name?: string | null
          contact?: Json
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          ends_at?: string | null
          event_date: string
          external_ref?: string | null
          guest_numbers?: number | null
          id?: string
          organisation_id: string
          room?: string | null
          source?: string
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          client_name?: string | null
          contact?: Json
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          ends_at?: string | null
          event_date?: string
          external_ref?: string | null
          guest_numbers?: number | null
          id?: string
          organisation_id?: string
          room?: string | null
          source?: string
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      exceptions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          item_key: string | null
          organisation_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_id: string
          source_type: string
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          item_key?: string | null
          organisation_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_id: string
          source_type: string
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          item_key?: string | null
          organisation_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_id?: string
          source_type?: string
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exceptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      external_people: {
        Row: {
          archived_at: string | null
          created_at: string
          display_name: string
          external_email: string | null
          external_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          linked_at: string | null
          linked_by: string | null
          organisation_id: string
          source: string
          updated_at: string
          user_id: string | null
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          display_name: string
          external_email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          linked_at?: string | null
          linked_by?: string | null
          organisation_id: string
          source: string
          updated_at?: string
          user_id?: string | null
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          display_name?: string
          external_email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          linked_at?: string | null
          linked_by?: string | null
          organisation_id?: string
          source?: string
          updated_at?: string
          user_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_people_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_people_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_people_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      handover_tasks: {
        Row: {
          created_at: string
          handover_id: string
          id: string
          organisation_id: string
          task_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          handover_id: string
          id?: string
          organisation_id: string
          task_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          handover_id?: string
          id?: string
          organisation_id?: string
          task_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_tasks_handover_id_venue_id_fkey"
            columns: ["handover_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "handovers"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "handover_tasks_task_id_venue_id_fkey"
            columns: ["task_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "handover_tasks_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      handovers: {
        Row: {
          archived_at: string | null
          cash_flags: string | null
          created_at: string
          created_by: string | null
          guests_to_watch: string | null
          id: string
          incoming_signed_at: string | null
          incoming_user_id: string | null
          notes: string | null
          open_issues: string | null
          organisation_id: string
          outgoing_signed_at: string | null
          outgoing_user_id: string
          shift_id: string | null
          stock_flags: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          cash_flags?: string | null
          created_at?: string
          created_by?: string | null
          guests_to_watch?: string | null
          id?: string
          incoming_signed_at?: string | null
          incoming_user_id?: string | null
          notes?: string | null
          open_issues?: string | null
          organisation_id: string
          outgoing_signed_at?: string | null
          outgoing_user_id: string
          shift_id?: string | null
          stock_flags?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          cash_flags?: string | null
          created_at?: string
          created_by?: string | null
          guests_to_watch?: string | null
          id?: string
          incoming_signed_at?: string | null
          incoming_user_id?: string | null
          notes?: string | null
          open_issues?: string | null
          organisation_id?: string
          outgoing_signed_at?: string | null
          outgoing_user_id?: string
          shift_id?: string | null
          stock_flags?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handovers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_incoming_user_id_fkey"
            columns: ["incoming_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_outgoing_user_id_fkey"
            columns: ["outgoing_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_shift_id_venue_id_fkey"
            columns: ["shift_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "handovers_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      import_batches: {
        Row: {
          committed_at: string | null
          committed_by: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          kind: string
          mapping_id: string | null
          organisation_id: string
          stats: Json
          status: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
          venue_id: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          committed_at?: string | null
          committed_by?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          kind: string
          mapping_id?: string | null
          organisation_id: string
          stats?: Json
          status?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
          venue_id: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          committed_at?: string | null
          committed_by?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          kind?: string
          mapping_id?: string | null
          organisation_id?: string
          stats?: Json
          status?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
          venue_id?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_committed_by_fkey"
            columns: ["committed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_mapping_id_venue_id_fkey"
            columns: ["mapping_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_mappings"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "import_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      import_mappings: {
        Row: {
          archived_at: string | null
          column_map: Json
          created_at: string
          id: string
          is_default: boolean
          kind: string
          name: string
          organisation_id: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          column_map?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          organisation_id: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          column_map?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          organisation_id?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_mappings_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      import_rows: {
        Row: {
          batch_id: string
          created_at: string
          errors: string[]
          id: string
          mapped: Json | null
          organisation_id: string
          outcome: string | null
          raw: Json
          row_no: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          errors?: string[]
          id?: string
          mapped?: Json | null
          organisation_id: string
          outcome?: string | null
          raw: Json
          row_no: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          errors?: string[]
          id?: string
          mapped?: Json | null
          organisation_id?: string
          outcome?: string | null
          raw?: Json
          row_no?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_batch_id_venue_id_fkey"
            columns: ["batch_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "import_rows_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      import_value_maps: {
        Row: {
          archived_at: string | null
          area_id: string | null
          created_at: string
          department_id: string | null
          field: string
          id: string
          ignore: boolean
          is_manager: boolean
          organisation_id: string
          shift_type_id: string | null
          source: string
          updated_at: string
          value: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          department_id?: string | null
          field: string
          id?: string
          ignore?: boolean
          is_manager?: boolean
          organisation_id: string
          shift_type_id?: string | null
          source: string
          updated_at?: string
          value: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          department_id?: string | null
          field?: string
          id?: string
          ignore?: boolean
          is_manager?: boolean
          organisation_id?: string
          shift_type_id?: string | null
          source?: string
          updated_at?: string
          value?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_value_maps_area_id_venue_id_fkey"
            columns: ["area_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "venue_areas"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "import_value_maps_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "import_value_maps_shift_type_id_venue_id_fkey"
            columns: ["shift_type_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shift_types"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "import_value_maps_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      incident_types: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          organisation_id: string
          required_fields: string[]
          restricted: boolean
          sort: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          organisation_id: string
          required_fields?: string[]
          restricted?: boolean
          sort?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          organisation_id?: string
          required_fields?: string[]
          restricted?: boolean
          sort?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_types_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      incidents: {
        Row: {
          action_taken: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string
          follow_up: string | null
          id: string
          incident_type_id: string
          occurred_at: string
          organisation_id: string
          people: Json
          restricted: boolean
          severity: string
          shift_id: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          action_taken?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          follow_up?: string | null
          id?: string
          incident_type_id: string
          occurred_at: string
          organisation_id: string
          people?: Json
          restricted?: boolean
          severity?: string
          shift_id?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          action_taken?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          follow_up?: string | null
          id?: string
          incident_type_id?: string
          occurred_at?: string
          organisation_id?: string
          people?: Json
          restricted?: boolean
          severity?: string
          shift_id?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_incident_type_id_venue_id_fkey"
            columns: ["incident_type_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "incident_types"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "incidents_shift_id_venue_id_fkey"
            columns: ["shift_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "incidents_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      maintenance_issues: {
        Row: {
          archived_at: string | null
          area_id: string | null
          created_at: string
          created_by: string | null
          details: string | null
          id: string
          organisation_id: string
          owner_user_id: string | null
          photo_path: string | null
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          organisation_id: string
          owner_user_id?: string | null
          photo_path?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          organisation_id?: string
          owner_user_id?: string | null
          photo_path?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_issues_area_id_venue_id_fkey"
            columns: ["area_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "venue_areas"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "maintenance_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_issues_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_issues_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      memberships: {
        Row: {
          archived_at: string | null
          created_at: string
          department_id: string | null
          id: string
          organisation_id: string
          pin_hash: string | null
          role_id: string
          status: string
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          organisation_id: string
          pin_hash?: string | null
          role_id: string
          status?: string
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          organisation_id?: string
          pin_hash?: string | null
          role_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "memberships_role_id_venue_id_fkey"
            columns: ["role_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          is_group_owner: boolean
          organisation_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_group_owner?: boolean
          organisation_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_group_owner?: boolean
          organisation_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      process_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          organisation_id: string
          process_version_id: string
          user_id: string
          venue_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          organisation_id: string
          process_version_id: string
          user_id?: string
          venue_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          organisation_id?: string
          process_version_id?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_acknowledgements_process_version_id_venue_id_fkey"
            columns: ["process_version_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "process_versions"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "process_acknowledgements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_acknowledgements_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      process_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organisation_id: string
          process_id: string
          published_at: string | null
          published_by: string | null
          search: unknown
          steps: Json
          updated_at: string
          venue_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organisation_id: string
          process_id: string
          published_at?: string | null
          published_by?: string | null
          search?: unknown
          steps?: Json
          updated_at?: string
          venue_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organisation_id?: string
          process_id?: string
          published_at?: string | null
          published_by?: string | null
          search?: unknown
          steps?: Json
          updated_at?: string
          venue_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_versions_process_id_venue_id_fkey"
            columns: ["process_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "process_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_versions_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      processes: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          department_id: string | null
          id: string
          is_emergency: boolean
          organisation_id: string
          pinned: boolean
          source_import_batch_id: string | null
          source_key: string | null
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          department_id?: string | null
          id?: string
          is_emergency?: boolean
          organisation_id: string
          pinned?: boolean
          source_import_batch_id?: string | null
          source_key?: string | null
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          department_id?: string | null
          id?: string
          is_emergency?: boolean
          organisation_id?: string
          pinned?: boolean
          source_import_batch_id?: string | null
          source_key?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "processes_id_current_version_id_fkey"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "process_versions"
            referencedColumns: ["process_id", "id"]
          },
          {
            foreignKeyName: "processes_source_import_batch_id_venue_id_fkey"
            columns: ["source_import_batch_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "processes_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qualification_types: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          organisation_id: string
          updated_at: string
          venue_id: string
          warn_days: number[]
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          organisation_id: string
          updated_at?: string
          venue_id: string
          warn_days?: number[]
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          organisation_id?: string
          updated_at?: string
          venue_id?: string
          warn_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "qualification_types_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      roles: {
        Row: {
          archived_at: string | null
          capabilities: string[]
          created_at: string
          id: string
          name: string
          organisation_id: string
          sort: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          capabilities?: string[]
          created_at?: string
          id?: string
          name: string
          organisation_id: string
          sort?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          capabilities?: string[]
          created_at?: string
          id?: string
          name?: string
          organisation_id?: string
          sort?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      roster_shifts: {
        Row: {
          batch_id: string
          created_at: string
          department_id: string | null
          ends_at: string
          external_person_id: string
          id: string
          is_manager: boolean
          organisation_id: string
          shift_detail: string | null
          starts_at: string
          superseded_by_batch_id: string | null
          team: string | null
          trading_date: string
          updated_at: string
          user_id: string | null
          venue_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          department_id?: string | null
          ends_at: string
          external_person_id: string
          id?: string
          is_manager?: boolean
          organisation_id: string
          shift_detail?: string | null
          starts_at: string
          superseded_by_batch_id?: string | null
          team?: string | null
          trading_date: string
          updated_at?: string
          user_id?: string | null
          venue_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          department_id?: string | null
          ends_at?: string
          external_person_id?: string
          id?: string
          is_manager?: boolean
          organisation_id?: string
          shift_detail?: string | null
          starts_at?: string
          superseded_by_batch_id?: string | null
          team?: string | null
          trading_date?: string
          updated_at?: string
          user_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_shifts_batch_id_venue_id_fkey"
            columns: ["batch_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "roster_shifts_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "roster_shifts_external_person_id_venue_id_fkey"
            columns: ["external_person_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "external_people"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "roster_shifts_superseded_by_batch_id_venue_id_fkey"
            columns: ["superseded_by_batch_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "roster_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_shifts_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      roster_sources: {
        Row: {
          active: boolean
          adapter: string
          archived_at: string | null
          config: Json
          created_at: string
          id: string
          last_synced_at: string | null
          organisation_id: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          adapter: string
          archived_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          last_synced_at?: string | null
          organisation_id: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          adapter?: string
          archived_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          last_synced_at?: string | null
          organisation_id?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_sources_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      run_items: {
        Row: {
          answered_at: string
          answered_by: string | null
          created_at: string
          id: string
          item_key: string
          organisation_id: string
          out_of_range: boolean
          photo_path: string | null
          run_id: string
          updated_at: string
          value: Json | null
          venue_id: string
        }
        Insert: {
          answered_at?: string
          answered_by?: string | null
          created_at?: string
          id?: string
          item_key: string
          organisation_id: string
          out_of_range?: boolean
          photo_path?: string | null
          run_id: string
          updated_at?: string
          value?: Json | null
          venue_id: string
        }
        Update: {
          answered_at?: string
          answered_by?: string | null
          created_at?: string
          id?: string
          item_key?: string
          organisation_id?: string
          out_of_range?: boolean
          photo_path?: string | null
          run_id?: string
          updated_at?: string
          value?: Json | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_items_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_items_run_id_venue_id_fkey"
            columns: ["run_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "checklist_runs"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "run_items_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      runsheet_entries: {
        Row: {
          archived_at: string | null
          at_time: string | null
          created_at: string
          details: string | null
          done_at: string | null
          done_by: string | null
          id: string
          organisation_id: string
          owner_user_id: string | null
          runsheet_id: string
          sort: number
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          at_time?: string | null
          created_at?: string
          details?: string | null
          done_at?: string | null
          done_by?: string | null
          id?: string
          organisation_id: string
          owner_user_id?: string | null
          runsheet_id: string
          sort?: number
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          at_time?: string | null
          created_at?: string
          details?: string | null
          done_at?: string | null
          done_by?: string | null
          id?: string
          organisation_id?: string
          owner_user_id?: string | null
          runsheet_id?: string
          sort?: number
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runsheet_entries_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runsheet_entries_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runsheet_entries_runsheet_id_venue_id_fkey"
            columns: ["runsheet_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "runsheets"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "runsheet_entries_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      runsheet_template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organisation_id: string
          published_at: string | null
          published_by: string | null
          sections: Json
          template_id: string
          updated_at: string
          venue_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organisation_id: string
          published_at?: string | null
          published_by?: string | null
          sections?: Json
          template_id: string
          updated_at?: string
          venue_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organisation_id?: string
          published_at?: string | null
          published_by?: string | null
          sections?: Json
          template_id?: string
          updated_at?: string
          venue_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "runsheet_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runsheet_template_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runsheet_template_versions_template_id_venue_id_fkey"
            columns: ["template_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "runsheet_templates"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "runsheet_template_versions_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      runsheet_templates: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          name: string
          organisation_id: string
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          name: string
          organisation_id: string
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name?: string
          organisation_id?: string
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runsheet_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runsheet_templates_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      runsheets: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          data: Json
          event_id: string | null
          id: string
          kind: string
          organisation_id: string
          post_event_notes: string | null
          shift_id: string | null
          status: string
          template_version_id: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          event_id?: string | null
          id?: string
          kind: string
          organisation_id: string
          post_event_notes?: string | null
          shift_id?: string | null
          status?: string
          template_version_id?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          event_id?: string | null
          id?: string
          kind?: string
          organisation_id?: string
          post_event_notes?: string | null
          shift_id?: string | null
          status?: string
          template_version_id?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runsheets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runsheets_event_id_venue_id_fkey"
            columns: ["event_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "runsheets_shift_id_venue_id_fkey"
            columns: ["shift_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "runsheets_template_version_id_venue_id_fkey"
            columns: ["template_version_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "runsheet_template_versions"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "runsheets_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      shift_managers: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          is_closer: boolean
          organisation_id: string
          shift_id: string
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_closer?: boolean
          organisation_id: string
          shift_id: string
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_closer?: boolean
          organisation_id?: string
          shift_id?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_managers_shift_id_venue_id_fkey"
            columns: ["shift_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "shift_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_managers_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      shift_types: {
        Row: {
          archived_at: string | null
          created_at: string
          default_end: string | null
          default_start: string | null
          id: string
          is_venue_close: boolean
          kind: string
          name: string
          organisation_id: string
          sort: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_end?: string | null
          default_start?: string | null
          id?: string
          is_venue_close?: boolean
          kind: string
          name: string
          organisation_id: string
          sort?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_end?: string | null
          default_start?: string | null
          id?: string
          is_venue_close?: boolean
          kind?: string
          name?: string
          organisation_id?: string
          sort?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_types_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      shifts: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organisation_id: string
          shift_type_id: string
          status: string
          trading_date: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organisation_id: string
          shift_type_id: string
          status?: string
          trading_date: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string
          shift_type_id?: string
          status?: string
          trading_date?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_shift_type_id_venue_id_fkey"
            columns: ["shift_type_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "shift_types"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "shifts_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      staff_qualifications: {
        Row: {
          archived_at: string | null
          created_at: string
          expires_on: string | null
          id: string
          import_batch_id: string | null
          number: string | null
          organisation_id: string
          qualification_type_id: string
          source: string
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          expires_on?: string | null
          id?: string
          import_batch_id?: string | null
          number?: string | null
          organisation_id: string
          qualification_type_id: string
          source?: string
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          expires_on?: string | null
          id?: string
          import_batch_id?: string | null
          number?: string | null
          organisation_id?: string
          qualification_type_id?: string
          source?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_qualifications_import_batch_id_venue_id_fkey"
            columns: ["import_batch_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "staff_qualifications_qualification_type_id_venue_id_fkey"
            columns: ["qualification_type_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "staff_qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_qualifications_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      task_comments: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          id: string
          organisation_id: string
          photo_path: string | null
          task_id: string
          venue_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organisation_id: string
          photo_path?: string | null
          task_id: string
          venue_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organisation_id?: string
          photo_path?: string | null
          task_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_venue_id_fkey"
            columns: ["task_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "task_comments_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          due_at: string | null
          id: string
          organisation_id: string
          owner_user_id: string | null
          priority: string
          proof_path: string | null
          proof_required: boolean
          recurrence: string | null
          recurrence_parent_id: string | null
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          organisation_id: string
          owner_user_id?: string | null
          priority?: string
          proof_path?: string | null
          proof_required?: boolean
          recurrence?: string | null
          recurrence_parent_id?: string | null
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          organisation_id?: string
          owner_user_id?: string | null
          priority?: string
          proof_path?: string | null
          proof_required?: boolean
          recurrence?: string | null
          recurrence_parent_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "tasks_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurrence_parent_id_venue_id_fkey"
            columns: ["recurrence_parent_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "tasks_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      venue_areas: {
        Row: {
          archived_at: string | null
          area_type: string | null
          created_at: string
          department_id: string | null
          id: string
          name: string
          organisation_id: string
          sort: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived_at?: string | null
          area_type?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
          organisation_id: string
          sort?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived_at?: string | null
          area_type?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
          organisation_id?: string
          sort?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_areas_department_id_venue_id_fkey"
            columns: ["department_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "venue_areas_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      venue_settings: {
        Row: {
          created_at: string
          enabled_modules: string[]
          jurisdiction: string
          nominated_approver_role_id: string | null
          organisation_id: string
          timezone: string
          trading_day_cutover: string
          trading_hours: Json
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          enabled_modules?: string[]
          jurisdiction: string
          nominated_approver_role_id?: string | null
          organisation_id: string
          timezone: string
          trading_day_cutover?: string
          trading_hours?: Json
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          enabled_modules?: string[]
          jurisdiction?: string
          nominated_approver_role_id?: string | null
          organisation_id?: string
          timezone?: string
          trading_day_cutover?: string
          trading_hours?: Json
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_settings_nominated_approver_role_id_venue_id_fkey"
            columns: ["nominated_approver_role_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "venue_settings_venue_org_fkey"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id", "organisation_id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          archived_at: string | null
          branding: Json
          created_at: string
          id: string
          licence_number: string | null
          licensee_entity_name: string | null
          name: string
          organisation_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          branding?: Json
          created_at?: string
          id?: string
          licence_number?: string | null
          licensee_entity_name?: string | null
          name: string
          organisation_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          branding?: Json
          created_at?: string
          id?: string
          licence_number?: string | null
          licensee_entity_name?: string | null
          name?: string
          organisation_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_capability: {
        Args: { p_capability: string; p_venue_id: string }
        Returns: boolean
      }
      my_venues: {
        Args: never
        Returns: {
          capabilities: string[]
          is_group_owner: boolean
          membership_status: string | null
          name: string
          organisation_id: string
          role_name: string | null
          slug: string
          venue_id: string
        }[]
      }
      revoke_user_sessions: {
        Args: { p_user_id: string }
        Returns: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
