// Supabase Database Types for Aurora E-commerce Platform
// Generated + Enhanced for Middleman workflow

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
      users: {
        Row: {
          user_id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          account_type: string[];
          currency: string;
          is_verified: boolean;
          is_factory: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "user_id" | "created_at" | "updated_at"
        > & { user_id?: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      middle_men: {
        Row: {
          id: string;
          user_id: string;
          commission_rate: number;
          total_earnings: number;
          pending_earnings: number;
          is_verified: boolean;
          specialization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["middle_men"]["Row"],
          | "id"
          | "total_earnings"
          | "pending_earnings"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["middle_men"]["Insert"]>;
      };
      middle_man_deals: {
        Row: {
          id: string;
          middle_man_id: string;
          product_asin: string;
          product_id: string | null;
          seller_id: string | null;
          commission_rate: number;
          margin_amount: number;
          unique_slug: string;
          clicks: number;
          conversions: number;
          total_revenue: number;
          is_active: boolean;
          approval_status:
            | "auto_approved"
            | "pending_approval"
            | "rejected"
            | "archived";
          expires_at: string | null;
          promo_tags: string[];
          last_price_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["middle_man_deals"]["Row"],
          | "id"
          | "clicks"
          | "conversions"
          | "total_revenue"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["middle_man_deals"]["Insert"]
        >;
      };
      commissions: {
        Row: {
          id: string;
          middle_man_id: string;
          order_id: string | null;
          deal_id: string | null;
          amount: number;
          commission_rate: number;
          status: "pending" | "approved" | "paid" | "cancelled";
          paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["commissions"]["Row"],
          "id" | "paid_at" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["commissions"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          asin: string;
          title: string;
          description: string | null;
          price: number;
          images: Json | null;
          seller_id: string;
          category: string | null;
          status: string;
          quantity: number;
          is_deleted: boolean;
          is_local_brand: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      website_settings: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          site_slug: string | null;
          status: 'draft' | 'active';
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["website_settings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["website_settings"]["Insert"]>;
      };
      site_catalog: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          display_price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["site_catalog"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["site_catalog"]["Insert"]>;
      };
      middleman_profiles: {
        Row: {
          id: string;
          user_id: string;
          tier: string;
          commission_rate: number;
          total_earnings: number;
          pending_earnings: number;
          is_verified: boolean;
          specialization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["middleman_profiles"]["Row"],
          "id" | "total_earnings" | "pending_earnings" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["middleman_profiles"]["Insert"]>;
      };
      sellers: {
        Row: {
          user_id: string;
          email: string;
          full_name: string | null;
          is_verified: boolean;
          is_factory: boolean;
          min_order_quantity: number;
          wholesale_discount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sellers"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["sellers"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          message_type: "text" | "image" | "file" | "deal_proposal";
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_size: number | null;
          is_deleted: boolean;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["messages"]["Row"],
          "id" | "read_at" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
    };
    Views: {
      middle_man_deals_public: {
        Row: {
          unique_slug: string;
          product_asin: string;
          title: string;
          description: string | null;
          images: Json | null;
          original_price: number;
          deal_price: number;
          commission_rate: number;
          margin_amount: number;
          clicks: number;
          conversions: number;
          seller_name: string | null;
          seller_verified: boolean | null;
        };
      };
    };
    Functions: {
      create_middle_man_deal: {
        Args: {
          p_middle_man_id: string;
          p_product_asin: string;
          p_commission_rate?: number;
          p_margin_amount?: number;
        };
        Returns: string;
      };
      track_deal_click: {
        Args: { p_unique_slug: string };
        Returns: void;
      };
      get_marketplace_products_for_middlemen: {
        Args: {
          p_category?: string;
          p_min_price?: number;
          p_max_price?: number;
          p_min_stock?: number;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          asin: string;
          title: string;
          description: string | null;
          price: number;
          images: Json | null;
          seller_id: string;
          seller_name: string | null;
          seller_rating: number;
          stock_quantity: number;
          category: string | null;
          is_local_brand: boolean | null;
        }[];
      };
      claim_and_create_promo_deal: {
        Args: {
          p_product_asin: string;
          p_margin_type: string;
          p_margin_value: number;
          p_expires_days?: number;
          p_promo_tags?: string[];
        };
        Returns: Json;
      };
      seller_signup: {
        Args: {
          p_email: string;
          p_password: string;
          p_full_name: string;
          p_phone?: string | null;
          p_location?: string | null;
          p_currency?: string;
        };
        Returns: Json;
      };
      factory_signup: {
        Args: {
          p_email: string;
          p_password: string;
          p_full_name: string;
          p_phone?: string | null;
          p_location?: string | null;
          p_currency?: string;
          p_company_name?: string | null;
          p_specialization?: string | null;
          p_production_capacity?: number | null;
        };
        Returns: Json;
      };
      middleman_signup: {
        Args: {
          p_email: string;
          p_password: string;
          p_full_name: string;
          p_phone?: string | null;
          p_location?: string | null;
          p_currency?: string;
          p_commission_rate?: number;
          p_specialization?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
}
