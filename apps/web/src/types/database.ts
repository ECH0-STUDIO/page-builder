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
          opening_hours: any | null
          social_links: any | null
          category: string[] | null
          tags: string[] | null
          marketplace_listed: boolean
          created_at: string
          updated_at: string
          payment_settings: any | null
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
          opening_hours?: any | null
          social_links?: any | null
          category?: string[] | null
          tags?: string[] | null
          marketplace_listed?: boolean
          created_at?: string
          updated_at?: string
          payment_settings?: any | null
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
          opening_hours?: any | null
          social_links?: any | null
          category?: string[] | null
          tags?: string[] | null
          marketplace_listed?: boolean
          created_at?: string
          updated_at?: string
          payment_settings?: any | null
        }
        Relationships: [
          { foreignKeyName: "businesses_owner_id_fkey", columns: ["owner_id"], isOneToOne: false, referencedRelation: "users", referencedColumns: ["id"] }
        ]
      }
      orders: {
        Row: {
          id: string
          business_id: string
          table_number: string | null
          customer_name: string | null
          customer_phone: string | null
          total_amount: number
          status: string
          payment_method: string | null
          payment_status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          table_number?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          total_amount?: number
          status?: string
          payment_method?: string | null
          payment_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          table_number?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          total_amount?: number
          status?: string
          payment_method?: string | null
          payment_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "orders_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }
        ]
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
          image_url: string | null
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
          id?: string
          business_id?: string
          name?: string
          sort_order?: number
          visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          
        ]
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
          id?: string
          business_id?: string
          vietqr_bank_id?: string | null
          vietqr_bank_name?: string | null
          vietqr_account_number?: string | null
          vietqr_account_name?: string | null
          updated_at?: string
        }
        Relationships: [
          
        ]
      }
      page_views: {
        Row: {
          id: string
          business_id: string
          viewed_at: string
          count: number
        }
        Insert: {
          id?: string
          business_id: string
          viewed_at?: string
          count?: number
        }
        Update: {
          id?: string
          business_id?: string
          viewed_at?: string
          count?: number
        }
        Relationships: [
          { foreignKeyName: "page_views_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          language: string
          currency: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          language?: string
          currency?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          language?: string
          currency?: string
        }
        Relationships: [
          
        ]
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
          tags: string[] | null
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
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          available?: boolean
          sort_order?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          
        ]
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
          id?: string
          group_id?: string
          label?: string
          price_delta?: number
          sort_order?: number
        }
        Relationships: [
          
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string | null
          item_name: string
          quantity: number
          unit_price: number
          options: any | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_id?: string | null
          item_name: string
          quantity?: number
          unit_price?: number
          options?: any | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string | null
          item_name?: string
          quantity?: number
          unit_price?: number
          options?: any | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"] }
        ]
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
          id?: string
          business_id?: string
          type?: string
          target_id?: string | null
          label?: string | null
          table_number?: number | null
          scan_count?: number
          created_at?: string
        }
        Relationships: [
          
        ]
      }
      page_blocks: {
        Row: {
          id: string
          business_id: string
          type: string
          sort_order: number
          visible: boolean
          config: any
          created_at: string
          updated_at: string
          spacing: any | null
          custom_css: string | null
          block_anchor_id: string | null
        }
        Insert: {
          id?: string
          business_id: string
          type: string
          sort_order?: number
          visible?: boolean
          config: any
          created_at?: string
          updated_at?: string
          spacing?: any | null
          custom_css?: string | null
          block_anchor_id?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          type?: string
          sort_order?: number
          visible?: boolean
          config?: any
          created_at?: string
          updated_at?: string
          spacing?: any | null
          custom_css?: string | null
          block_anchor_id?: string | null
        }
        Relationships: [
          
        ]
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
          favicon_url: string | null
          apple_touch_icon_url: string | null
          language: string
          gsc_verification: string | null
          google_analytics_id: string | null
          facebook_pixel_id: string | null
          tiktok_pixel_id: string | null
          published_blocks: any | null
          published_theme: any | null
          has_unpublished_changes: boolean | null
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
          favicon_url?: string | null
          apple_touch_icon_url?: string | null
          language?: string
          gsc_verification?: string | null
          google_analytics_id?: string | null
          facebook_pixel_id?: string | null
          tiktok_pixel_id?: string | null
          published_blocks?: any | null
          published_theme?: any | null
          has_unpublished_changes?: boolean | null
        }
        Update: {
          id?: string
          business_id?: string
          published?: boolean
          custom_domain?: string | null
          seo_title?: string | null
          seo_description?: string | null
          og_image_url?: string | null
          updated_at?: string
          favicon_url?: string | null
          apple_touch_icon_url?: string | null
          language?: string
          gsc_verification?: string | null
          google_analytics_id?: string | null
          facebook_pixel_id?: string | null
          tiktok_pixel_id?: string | null
          published_blocks?: any | null
          published_theme?: any | null
          has_unpublished_changes?: boolean | null
        }
        Relationships: [
          
        ]
      }
      storage_subscriptions: { Row: any; Insert: any; Update: any; Relationships: any }
      credit_balances: { Row: any; Insert: any; Update: any; Relationships: any }
      credit_orders: { Row: any; Insert: any; Update: any; Relationships: any }
      credit_transactions: { Row: any; Insert: any; Update: any; Relationships: any }
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
          id?: string
          business_id?: string
          name?: string
          template_id?: string
          page_size?: string
          category_filter?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          
        ]
      }
      menu_item_variant_groups: {
        Row: {
          id: string
          item_id: string
          name: string
          required: boolean
          sort_order: number
          allow_multiple: boolean
        }
        Insert: {
          id?: string
          item_id: string
          name: string
          required?: boolean
          sort_order?: number
          allow_multiple?: boolean
        }
        Update: {
          id?: string
          item_id?: string
          name?: string
          required?: boolean
          sort_order?: number
          allow_multiple?: boolean
        }
        Relationships: [
          
        ]
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "business_members_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] },
          { foreignKeyName: "business_members_user_id_fkey", columns: ["user_id"], isOneToOne: false, referencedRelation: "users", referencedColumns: ["id"] }
        ]
      }
      team_invitations: {
        Row: {
          id: string
          business_id: string
          email: string
          role: string
          token: string
          status: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          business_id: string
          email: string
          role: string
          token?: string
          status?: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          email?: string
          role?: string
          token?: string
          status?: string
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          { foreignKeyName: "team_invitations_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }
        ]
      }
      theme_settings: {
        Row: {
          id: string
          business_id: string
          primary_color: string
          background_color: string
          font_family: string
          updated_at: string
          heading_font_family: string | null
          navbar_config: any | null
          footer_config: any | null
          hero_image_url: string | null
        }
        Insert: {
          id?: string
          business_id: string
          primary_color?: string
          background_color?: string
          font_family?: string
          updated_at?: string
          heading_font_family?: string | null
          navbar_config?: any | null
          footer_config?: any | null
        }
        Update: {
          id?: string
          business_id?: string
          primary_color?: string
          background_color?: string
          font_family?: string
          updated_at?: string
          heading_font_family?: string | null
          navbar_config?: any | null
          footer_config?: any | null
        }
        Relationships: [
          
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    
    Functions: {
      check_slug_available: {
        Args: { p_slug: string, p_exclude_id: string | null }
        Returns: boolean
      }
      is_owner_of_business: {
        Args: { _user_id: string, _business_id: string }
        Returns: boolean
      }
      is_business_published: {
        Args: { _business_id: string }
        Returns: boolean
      }
      increment_page_view: {
        Args: { p_business_id: string, p_date: string }
        Returns: undefined
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
