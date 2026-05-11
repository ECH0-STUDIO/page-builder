// Auto-generated type stubs matching 001_initial_schema.sql
// TODO: Replace with generated types via: npx supabase gen types typescript --project-id lwupkuhygzybnkoaoenr > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          address: string | null
          city: string | null
          phone: string | null
          email: string | null
          opening_hours: Json
          social_links: Json
          category: string[]
          tags: string[]
          marketplace_listed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          logo_url?: string | null
          address?: string | null
          city?: string | null
          phone?: string | null
          email?: string | null
          opening_hours?: Json
          social_links?: Json
          category?: string[]
          tags?: string[]
          marketplace_listed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          address?: string | null
          city?: string | null
          phone?: string | null
          email?: string | null
          opening_hours?: Json
          social_links?: Json
          category?: string[]
          tags?: string[]
          marketplace_listed?: boolean
          updated_at?: string
        }
      }
      theme_settings: {
        Row: {
          id: string
          business_id: string
          primary_color: string
          background_color: string
          font_family: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          primary_color?: string
          background_color?: string
          font_family?: string
          updated_at?: string
        }
        Update: {
          primary_color?: string
          background_color?: string
          font_family?: string
          updated_at?: string
        }
      }
      publishing_settings: {
        Row: {
          id: string
          business_id: string
          published: boolean
          custom_domain: string | null
          seo_title: string | null
          seo_description: string | null
          og_image_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          published?: boolean
          custom_domain?: string | null
          seo_title?: string | null
          seo_description?: string | null
          og_image_url?: string | null
          updated_at?: string
        }
        Update: {
          published?: boolean
          custom_domain?: string | null
          seo_title?: string | null
          seo_description?: string | null
          og_image_url?: string | null
          updated_at?: string
        }
      }
      page_blocks: {
        Row: {
          id: string
          business_id: string
          type: string
          sort_order: number
          visible: boolean
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          type: string
          sort_order?: number
          visible?: boolean
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          sort_order?: number
          visible?: boolean
          config?: Json
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          business_id: string
          name: string
          sort_order: number
          visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          sort_order?: number
          visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          sort_order?: number
          visible?: boolean
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          business_id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          available: boolean
          sort_order: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          category_id: string
          name: string
          description?: string | null
          price?: number
          image_url?: string | null
          available?: boolean
          sort_order?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          available?: boolean
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
      }
      menu_item_variant_groups: {
        Row: {
          id: string
          item_id: string
          name: string
          required: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          item_id: string
          name: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          name?: string
          required?: boolean
          sort_order?: number
        }
      }
      menu_item_variant_options: {
        Row: {
          id: string
          group_id: string
          label: string
          price_delta: number
          sort_order: number
        }
        Insert: {
          id?: string
          group_id: string
          label: string
          price_delta?: number
          sort_order?: number
        }
        Update: {
          label?: string
          price_delta?: number
          sort_order?: number
        }
      }
      payment_settings: {
        Row: {
          id: string
          business_id: string
          vietqr_bank_id: string | null
          vietqr_bank_name: string | null
          vietqr_account_number: string | null
          vietqr_account_name: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          vietqr_bank_id?: string | null
          vietqr_bank_name?: string | null
          vietqr_account_number?: string | null
          vietqr_account_name?: string | null
          updated_at?: string
        }
        Update: {
          vietqr_bank_id?: string | null
          vietqr_bank_name?: string | null
          vietqr_account_number?: string | null
          vietqr_account_name?: string | null
          updated_at?: string
        }
      }
      qr_codes: {
        Row: {
          id: string
          business_id: string
          type: string
          target_id: string | null
          label: string | null
          table_number: number | null
          scan_count: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          type: string
          target_id?: string | null
          label?: string | null
          table_number?: number | null
          scan_count?: number
          created_at?: string
        }
        Update: {
          label?: string | null
          table_number?: number | null
          scan_count?: number
        }
      }
      print_menus: {
        Row: {
          id: string
          business_id: string
          name: string
          template_id: string
          page_size: string
          category_filter: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name?: string
          template_id?: string
          page_size?: string
          category_filter?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          template_id?: string
          page_size?: string
          category_filter?: string[] | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      check_slug_available: {
        Args: { p_slug: string; p_exclude_id?: string | null }
        Returns: boolean
      }
      is_owner_of_business: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_business_published: {
        Args: { p_business_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
