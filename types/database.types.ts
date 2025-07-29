export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          status: 'pending' | 'accepted' | 'rejected'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          status?: 'pending' | 'accepted' | 'rejected'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          status?: 'pending' | 'accepted' | 'rejected'
          joined_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          icon?: string | null
          created_at?: string
        }
      }
      grocery_items: {
        Row: {
          id: string
          name: string
          category_id: string | null
          default_price: number | null
          unit: string
          image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          default_price?: number | null
          unit?: string
          image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          default_price?: number | null
          unit?: string
          image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shopping_lists: {
        Row: {
          id: string
          name: string
          group_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          group_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          group_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      shopping_list_items: {
        Row: {
          id: string
          shopping_list_id: string
          grocery_item_id: string
          quantity: number
          price_per_unit: number | null
          notes: string | null
          is_purchased: boolean
          purchased_by: string | null
          purchased_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shopping_list_id: string
          grocery_item_id: string
          quantity?: number
          price_per_unit?: number | null
          notes?: string | null
          is_purchased?: boolean
          purchased_by?: string | null
          purchased_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shopping_list_id?: string
          grocery_item_id?: string
          quantity?: number
          price_per_unit?: number | null
          notes?: string | null
          is_purchased?: boolean
          purchased_by?: string | null
          purchased_at?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          shopping_list_id: string | null
          group_id: string | null
          created_by: string
          total_amount: number
          purchase_date: string
          store_name: string | null
          receipt_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shopping_list_id?: string | null
          group_id?: string | null
          created_by: string
          total_amount: number
          purchase_date: string
          store_name?: string | null
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shopping_list_id?: string | null
          group_id?: string | null
          created_by?: string
          total_amount?: number
          purchase_date?: string
          store_name?: string | null
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      expense_items: {
        Row: {
          id: string
          expense_id: string
          grocery_item_id: string
          quantity: number
          price_per_unit: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          grocery_item_id: string
          quantity: number
          price_per_unit: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          grocery_item_id?: string
          quantity?: number
          price_per_unit?: number
          total_price?: number
          created_at?: string
        }
      }
      expense_shares: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount: number
          status: 'pending' | 'paid' | 'cancelled'
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount: number
          status?: 'pending' | 'paid' | 'cancelled'
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          amount?: number
          status?: 'pending' | 'paid' | 'cancelled'
          paid_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
