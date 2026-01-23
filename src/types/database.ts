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
      stores: {
        Row: {
          id: string
          store_code: string
          store_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_code: string
          store_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_code?: string
          store_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      makers: {
        Row: {
          id: string
          group_code: string
          maker_name: string
          order_category: string | null
          minimum_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_code: string
          maker_name: string
          order_category?: string | null
          minimum_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_code?: string
          maker_name?: string
          order_category?: string | null
          minimum_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          name: string
          email: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          sort_order: number
          is_extension: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sort_order?: number
          is_extension?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sort_order?: number
          is_extension?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          maker_id: string | null
          category_id: string | null
          product_code: string
          level1: string | null
          level2: string | null
          level3: string | null
          level4: string | null
          level5: string | null
          level6: string | null
          level7: string | null
          level8: string | null
          product_name: string
          unit_price: number
          cost_price: number
          supplier: string | null
          notes: string | null
          assigned_staff_id: string | null
          track_hq_inventory: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          maker_id?: string | null
          category_id?: string | null
          product_code: string
          level1?: string | null
          level2?: string | null
          level3?: string | null
          level4?: string | null
          level5?: string | null
          level6?: string | null
          level7?: string | null
          level8?: string | null
          product_name: string
          unit_price?: number
          cost_price?: number
          supplier?: string | null
          notes?: string | null
          assigned_staff_id?: string | null
          track_hq_inventory?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          maker_id?: string | null
          category_id?: string | null
          product_code?: string
          level1?: string | null
          level2?: string | null
          level3?: string | null
          level4?: string | null
          level5?: string | null
          level6?: string | null
          level7?: string | null
          level8?: string | null
          product_name?: string
          unit_price?: number
          cost_price?: number
          supplier?: string | null
          notes?: string | null
          assigned_staff_id?: string | null
          track_hq_inventory?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hq_inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          threshold: number
          last_updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          threshold?: number
          last_updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          threshold?: number
          last_updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_history: {
        Row: {
          id: string
          product_id: string
          change_type: string
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason: string | null
          order_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          change_type: string
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason?: string | null
          order_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          change_type?: string
          quantity?: number
          previous_quantity?: number
          new_quantity?: number
          reason?: string | null
          order_id?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          store_id: string
          status: string
          assigned_staff_id: string | null
          assignment_type: string | null
          notes: string | null
          order_date: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          store_id: string
          status?: string
          assigned_staff_id?: string | null
          assignment_type?: string | null
          notes?: string | null
          order_date?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          store_id?: string
          status?: string
          assigned_staff_id?: string | null
          assignment_type?: string | null
          notes?: string | null
          order_date?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number | null
          hq_stock_at_order: number | null
          fulfilled_from: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price?: number | null
          hq_stock_at_order?: number | null
          fulfilled_from?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number | null
          hq_stock_at_order?: number | null
          fulfilled_from?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      supplier_orders: {
        Row: {
          id: string
          order_number: string
          maker_id: string
          assigned_staff_id: string | null
          status: string
          total_amount: number | null
          notes: string | null
          order_date: string
          expected_date: string | null
          received_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          maker_id: string
          assigned_staff_id?: string | null
          status?: string
          total_amount?: number | null
          notes?: string | null
          order_date?: string
          expected_date?: string | null
          received_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          maker_id?: string
          assigned_staff_id?: string | null
          status?: string
          total_amount?: number | null
          notes?: string | null
          order_date?: string
          expected_date?: string | null
          received_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supplier_order_items: {
        Row: {
          id: string
          supplier_order_id: string
          product_id: string
          quantity: number
          unit_cost: number | null
          received_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_order_id: string
          product_id: string
          quantity: number
          unit_cost?: number | null
          received_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_order_id?: string
          product_id?: string
          quantity?: number
          unit_cost?: number | null
          received_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      low_stock_alert: {
        Row: {
          product_id: string
          product_code: string
          product_name: string
          level1: string | null
          level2: string | null
          level3: string | null
          maker_name: string | null
          category_name: string | null
          current_stock: number
          threshold: number
          assigned_staff_name: string | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// 便利な型エイリアス
export type Store = Database['public']['Tables']['stores']['Row']
export type Maker = Database['public']['Tables']['makers']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type HqInventory = Database['public']['Tables']['hq_inventory']['Row']
export type InventoryHistory = Database['public']['Tables']['inventory_history']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type SupplierOrder = Database['public']['Tables']['supplier_orders']['Row']
export type SupplierOrderItem = Database['public']['Tables']['supplier_order_items']['Row']
export type LowStockAlert = Database['public']['Views']['low_stock_alert']['Row']

// 拡張型（リレーション含む）
export type ProductWithRelations = Product & {
  makers?: Maker | null
  categories?: Category | null
  staff?: Staff | null
  hq_inventory?: HqInventory | null
}

export type OrderWithRelations = Order & {
  stores?: Store
  staff?: Staff | null
  order_items?: (OrderItem & {
    products?: Product
  })[]
}
