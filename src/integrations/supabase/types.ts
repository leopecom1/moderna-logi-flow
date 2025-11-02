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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts_receivable: {
        Row: {
          balance_due: number | null
          credit_limit: number | null
          credit_status: string | null
          customer_id: string
          days_since_last_sale: number | null
          id: string
          last_collection_date: string | null
          last_sale_date: string | null
          total_collections: number
          total_sales: number
          updated_at: string
        }
        Insert: {
          balance_due?: number | null
          credit_limit?: number | null
          credit_status?: string | null
          customer_id: string
          days_since_last_sale?: number | null
          id?: string
          last_collection_date?: string | null
          last_sale_date?: string | null
          total_collections?: number
          total_sales?: number
          updated_at?: string
        }
        Update: {
          balance_due?: number | null
          credit_limit?: number | null
          credit_status?: string | null
          customer_id?: string
          days_since_last_sale?: number | null
          id?: string
          last_collection_date?: string | null
          last_sale_date?: string | null
          total_collections?: number
          total_sales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      armadores: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assembly_photos: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          photo_type: string
          photo_url: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          photo_type: string
          photo_url: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          photo_type?: string
          photo_url?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_cash_registers: {
        Row: {
          branch_id: string
          created_at: string
          current_balance: number
          id: string
          initial_amount: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          current_balance?: number
          id?: string
          initial_amount?: number
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          current_balance?: number
          id?: string
          initial_amount?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      branch_warehouses: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          manager_name: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_name?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_name?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          reference_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          reference_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reference_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cadete_profiles: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_name: string | null
          cadete_id: string
          city: string | null
          created_at: string
          date_of_birth: string | null
          departamento: string | null
          driver_license_category: string | null
          driver_license_expiry: string | null
          driver_license_number: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          health_insurance_company: string | null
          health_insurance_number: string | null
          id: string
          identification_number: string | null
          marital_status: string | null
          neighborhood: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          cadete_id: string
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          departamento?: string | null
          driver_license_category?: string | null
          driver_license_expiry?: string | null
          driver_license_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          health_insurance_company?: string | null
          health_insurance_number?: string | null
          id?: string
          identification_number?: string | null
          marital_status?: string | null
          neighborhood?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          cadete_id?: string
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          departamento?: string | null
          driver_license_category?: string | null
          driver_license_expiry?: string | null
          driver_license_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          health_insurance_company?: string | null
          health_insurance_number?: string | null
          id?: string
          identification_number?: string | null
          marital_status?: string | null
          neighborhood?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadete_profiles_cadete_id_fkey"
            columns: ["cadete_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      card_liquidations: {
        Row: {
          amount: number
          card_type: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          expected_arrival_date: string | null
          id: string
          liquidation_date: string
          notes: string | null
          payment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          card_type: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          expected_arrival_date?: string | null
          id?: string
          liquidation_date: string
          notes?: string | null
          payment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          card_type?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          expected_arrival_date?: string | null
          id?: string
          liquidation_date?: string
          notes?: string | null
          payment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_register_config: {
        Row: {
          allow_send_to_central: boolean
          branch_id: string
          created_at: string
          default_opening_amount: number
          id: string
          max_petty_cash_expense: number
          require_manager_approval_for_send: boolean
          updated_at: string
        }
        Insert: {
          allow_send_to_central?: boolean
          branch_id: string
          created_at?: string
          default_opening_amount?: number
          id?: string
          max_petty_cash_expense?: number
          require_manager_approval_for_send?: boolean
          updated_at?: string
        }
        Update: {
          allow_send_to_central?: boolean
          branch_id?: string
          created_at?: string
          default_opening_amount?: number
          id?: string
          max_petty_cash_expense?: number
          require_manager_approval_for_send?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          reference_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          reference_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          reference_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          account_info: string | null
          amount: number
          bank_name: string | null
          collection_date: string
          collection_status: string
          collection_time: string | null
          collector_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          order_id: string | null
          payment_method_type: string
          payment_reference: string | null
          receipt_number: string | null
          sale_id: string | null
          updated_at: string
        }
        Insert: {
          account_info?: string | null
          amount: number
          bank_name?: string | null
          collection_date: string
          collection_status?: string
          collection_time?: string | null
          collector_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method_type: string
          payment_reference?: string | null
          receipt_number?: string | null
          sale_id?: string | null
          updated_at?: string
        }
        Update: {
          account_info?: string | null
          amount?: number
          bank_name?: string | null
          collection_date?: string
          collection_status?: string
          collection_time?: string | null
          collector_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method_type?: string
          payment_reference?: string | null
          receipt_number?: string | null
          sale_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_moderna_installments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          customer_id: string
          due_date: string
          id: string
          installment_number: number
          is_unified_source: boolean | null
          notes: string | null
          order_id: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_id: string | null
          status: string
          total_installments: number
          unified_installment_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by: string
          customer_id: string
          due_date: string
          id?: string
          installment_number: number
          is_unified_source?: boolean | null
          notes?: string | null
          order_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          total_installments: number
          unified_installment_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          customer_id?: string
          due_date?: string
          id?: string
          installment_number?: number
          is_unified_source?: boolean | null
          notes?: string | null
          order_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          total_installments?: number
          unified_installment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_moderna_installments_unified_installment_id_fkey"
            columns: ["unified_installment_id"]
            isOneToOne: false
            referencedRelation: "credit_moderna_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_moderna_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_moderna_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_moderna_payment"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          buy_rate: number
          created_at: string
          currency_code: string
          currency_name: string
          id: string
          is_active: boolean
          last_updated: string
          sell_rate: number
          updated_at: string
        }
        Insert: {
          buy_rate?: number
          created_at?: string
          currency_code: string
          currency_name: string
          id?: string
          is_active?: boolean
          last_updated?: string
          sell_rate?: number
          updated_at?: string
        }
        Update: {
          buy_rate?: number
          created_at?: string
          currency_code?: string
          currency_name?: string
          id?: string
          is_active?: boolean
          last_updated?: string
          sell_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_movements: {
        Row: {
          balance_amount: number
          created_at: string
          customer_id: string
          id: string
          movement_date: string
          payment_info: string | null
          updated_at: string
        }
        Insert: {
          balance_amount?: number
          created_at?: string
          customer_id: string
          id?: string
          movement_date: string
          payment_info?: string | null
          updated_at?: string
        }
        Update: {
          balance_amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          movement_date?: string
          payment_info?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          cedula_identidad: string | null
          city: string
          created_at: string
          customer_number: string | null
          departamento: string | null
          email: string | null
          id: string
          margen: number | null
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          cedula_identidad?: string | null
          city?: string
          created_at?: string
          customer_number?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          margen?: number | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          cedula_identidad?: string | null
          city?: string
          created_at?: string
          customer_number?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          margen?: number | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_cash_closures: {
        Row: {
          amount_sent_to_central: number | null
          card_payments: number
          cash_register_id: string
          closed_by: string
          closure_date: string
          created_at: string
          difference: number | null
          id: string
          manual_cash_count: number | null
          notes: string | null
          opening_balance: number
          other_payments: number
          remaining_amount: number | null
          sent_to_central: boolean
          sent_to_central_at: string | null
          sent_to_central_by: string | null
          system_calculated_balance: number
          total_expenses: number
          transfer_payments: number
          updated_at: string
        }
        Insert: {
          amount_sent_to_central?: number | null
          card_payments?: number
          cash_register_id: string
          closed_by: string
          closure_date?: string
          created_at?: string
          difference?: number | null
          id?: string
          manual_cash_count?: number | null
          notes?: string | null
          opening_balance?: number
          other_payments?: number
          remaining_amount?: number | null
          sent_to_central?: boolean
          sent_to_central_at?: string | null
          sent_to_central_by?: string | null
          system_calculated_balance?: number
          total_expenses?: number
          transfer_payments?: number
          updated_at?: string
        }
        Update: {
          amount_sent_to_central?: number | null
          card_payments?: number
          cash_register_id?: string
          closed_by?: string
          closure_date?: string
          created_at?: string
          difference?: number | null
          id?: string
          manual_cash_count?: number | null
          notes?: string | null
          opening_balance?: number
          other_payments?: number
          remaining_amount?: number | null
          sent_to_central?: boolean
          sent_to_central_at?: string | null
          sent_to_central_by?: string | null
          system_calculated_balance?: number
          total_expenses?: number
          transfer_payments?: number
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          attempted_at: string | null
          cadete_id: string
          created_at: string
          delivered_at: string | null
          delivery_notes: string | null
          id: string
          latitude: number | null
          longitude: number | null
          order_id: string
          route_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          attempted_at?: string | null
          cadete_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          order_id: string
          route_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          attempted_at?: string | null
          cadete_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          order_id?: string
          route_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          delivery_id: string | null
          description: string
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          order_id: string | null
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_id?: string | null
          description: string
          id?: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          order_id?: string | null
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_id?: string | null
          description?: string
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          order_id?: string | null
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          last_updated: string
          maximum_stock: number | null
          minimum_stock: number | null
          product_id: string
          unit_cost: number
          variant_id: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          last_updated?: string
          maximum_stock?: number | null
          minimum_stock?: number | null
          product_id: string
          unit_cost?: number
          variant_id?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          last_updated?: string
          maximum_stock?: number | null
          minimum_stock?: number | null
          product_id?: string
          unit_cost?: number
          variant_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          from_warehouse_id: string | null
          id: string
          inventory_item_id: string
          movement_date: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_document: string | null
          status: string | null
          to_warehouse_id: string | null
          total_value: number | null
          unit_cost: number
          updated_at: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          from_warehouse_id?: string | null
          id?: string
          inventory_item_id: string
          movement_date?: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_document?: string | null
          status?: string | null
          to_warehouse_id?: string | null
          total_value?: number | null
          unit_cost?: number
          updated_at?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          from_warehouse_id?: string | null
          id?: string
          inventory_item_id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_document?: string | null
          status?: string | null
          to_warehouse_id?: string | null
          total_value?: number | null
          unit_cost?: number
          updated_at?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_valuations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          total_items: number
          total_value: number
          valuation_data: Json
          valuation_date: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          total_items?: number
          total_value?: number
          valuation_data?: Json
          valuation_date?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          total_items?: number
          total_value?: number
          valuation_data?: Json
          valuation_date?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_valuations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      location_alerts: {
        Row: {
          alert_type: string
          created_at: string
          delivery_id: string | null
          id: string
          is_active: boolean
          latitude: number | null
          location_name: string | null
          longitude: number | null
          radius: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          delivery_id?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          radius?: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          delivery_id?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          radius?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_alerts_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          notification_id: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          notification_id?: string | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          notification_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          delivery_radius: number
          email_enabled: boolean
          id: string
          location_alerts: boolean
          notification_types: Json
          phone_number: string | null
          push_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          sms_enabled: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          delivery_radius?: number
          email_enabled?: boolean
          id?: string
          location_alerts?: boolean
          notification_types?: Json
          phone_number?: string | null
          push_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          sms_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          delivery_radius?: number
          email_enabled?: boolean
          id?: string
          location_alerts?: boolean
          notification_types?: Json
          phone_number?: string | null
          push_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          sms_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          armado_completado_at: string | null
          armado_confirmado_at: string | null
          armado_confirmado_por: string | null
          armado_contacto_nombre: string | null
          armado_contacto_telefono: string | null
          armado_estado: string | null
          armado_fecha: string | null
          armado_horario: string | null
          armador_entrega_mercaderia: boolean | null
          armador_id: string | null
          branch_id: string | null
          cadete_id: string | null
          created_at: string
          currency_rate: number | null
          customer_id: string
          delivery_address: string
          delivery_date: string | null
          delivery_departamento: string | null
          delivery_neighborhood: string | null
          delivery_time_slot: string | null
          entregar_ahora: boolean | null
          exchange_rate_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          products: Json
          requiere_armado: boolean | null
          retiro_en_sucursal: boolean | null
          route_id: string | null
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          armado_completado_at?: string | null
          armado_confirmado_at?: string | null
          armado_confirmado_por?: string | null
          armado_contacto_nombre?: string | null
          armado_contacto_telefono?: string | null
          armado_estado?: string | null
          armado_fecha?: string | null
          armado_horario?: string | null
          armador_entrega_mercaderia?: boolean | null
          armador_id?: string | null
          branch_id?: string | null
          cadete_id?: string | null
          created_at?: string
          currency_rate?: number | null
          customer_id: string
          delivery_address: string
          delivery_date?: string | null
          delivery_departamento?: string | null
          delivery_neighborhood?: string | null
          delivery_time_slot?: string | null
          entregar_ahora?: boolean | null
          exchange_rate_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          products: Json
          requiere_armado?: boolean | null
          retiro_en_sucursal?: boolean | null
          route_id?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          armado_completado_at?: string | null
          armado_confirmado_at?: string | null
          armado_confirmado_por?: string | null
          armado_contacto_nombre?: string | null
          armado_contacto_telefono?: string | null
          armado_estado?: string | null
          armado_fecha?: string | null
          armado_horario?: string | null
          armador_entrega_mercaderia?: boolean | null
          armador_id?: string | null
          branch_id?: string | null
          cadete_id?: string | null
          created_at?: string
          currency_rate?: number | null
          customer_id?: string
          delivery_address?: string
          delivery_date?: string | null
          delivery_departamento?: string | null
          delivery_neighborhood?: string | null
          delivery_time_slot?: string | null
          entregar_ahora?: boolean | null
          exchange_rate_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          products?: Json
          requiere_armado?: boolean | null
          retiro_en_sucursal?: boolean | null
          route_id?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_armador_id_fkey"
            columns: ["armador_id"]
            isOneToOne: false
            referencedRelation: "armadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          card_type: string | null
          created_at: string
          id: string
          liquidated_at: string | null
          liquidation_date: string | null
          notes: string | null
          order_id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          card_type?: string | null
          created_at?: string
          id?: string
          liquidated_at?: string | null
          liquidation_date?: string | null
          notes?: string | null
          order_id: string
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          card_type?: string | null
          created_at?: string
          id?: string
          liquidated_at?: string | null
          liquidation_date?: string | null
          notes?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          cash_register_id: string
          category: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          cash_register_id: string
          category: string
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          cash_register_id?: string
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      price_lists_config: {
        Row: {
          auto_calculate_enabled: boolean
          created_at: string
          id: string
          margin_percentage_list_1: number | null
          margin_percentage_list_2: number | null
          price_list_1_name: string
          price_list_2_name: string
          updated_at: string
        }
        Insert: {
          auto_calculate_enabled?: boolean
          created_at?: string
          id?: string
          margin_percentage_list_1?: number | null
          margin_percentage_list_2?: number | null
          price_list_1_name?: string
          price_list_2_name?: string
          updated_at?: string
        }
        Update: {
          auto_calculate_enabled?: boolean
          created_at?: string
          id?: string
          margin_percentage_list_1?: number | null
          margin_percentage_list_2?: number | null
          price_list_1_name?: string
          price_list_2_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variant_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variant_values: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          variant_type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          variant_type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          variant_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_values_variant_type_id_fkey"
            columns: ["variant_type_id"]
            isOneToOne: false
            referencedRelation: "product_variant_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          price_adjustment: number | null
          product_id: string
          sku: string | null
          updated_at: string
          variant_values: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number | null
          product_id: string
          sku?: string | null
          updated_at?: string
          variant_values?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number | null
          product_id?: string
          sku?: string | null
          updated_at?: string
          variant_values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          code: string
          cost: number
          created_at: string
          currency: string
          has_variants: boolean
          id: string
          is_active: boolean
          margin_percentage: number | null
          name: string
          price: number
          price_list_1: number
          price_list_2: number
          supplier_code: string | null
          updated_at: string
          use_automatic_pricing: boolean
          warranty_months: number | null
          warranty_years: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          code: string
          cost: number
          created_at?: string
          currency?: string
          has_variants?: boolean
          id?: string
          is_active?: boolean
          margin_percentage?: number | null
          name: string
          price: number
          price_list_1?: number
          price_list_2?: number
          supplier_code?: string | null
          updated_at?: string
          use_automatic_pricing?: boolean
          warranty_months?: number | null
          warranty_years?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          code?: string
          cost?: number
          created_at?: string
          currency?: string
          has_variants?: boolean
          id?: string
          is_active?: boolean
          margin_percentage?: number | null
          name?: string
          price?: number
          price_list_1?: number
          price_list_2?: number
          supplier_code?: string | null
          updated_at?: string
          use_automatic_pricing?: boolean
          warranty_months?: number | null
          warranty_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_id: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_id: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          custom_payment_terms: boolean | null
          exchange_rate: number | null
          id: string
          is_check_payment: boolean | null
          is_import: boolean
          notes: string | null
          payment_days: number | null
          payment_method: string | null
          purchase_date: string
          purchase_number: string
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          custom_payment_terms?: boolean | null
          exchange_rate?: number | null
          id?: string
          is_check_payment?: boolean | null
          is_import?: boolean
          notes?: string | null
          payment_days?: number | null
          payment_method?: string | null
          purchase_date: string
          purchase_number: string
          status?: string
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          custom_payment_terms?: boolean | null
          exchange_rate?: number | null
          id?: string
          is_check_payment?: boolean | null
          is_import?: boolean
          notes?: string | null
          payment_days?: number | null
          payment_method?: string | null
          purchase_date?: string
          purchase_number?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          subscription: Json
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          subscription: Json
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          subscription?: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      requested_purchases: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          received_at: string | null
          received_by: string | null
          requested_at: string | null
          requested_by: string
          status: string | null
          supplier_id: string | null
          unit_cost: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity: number
          received_at?: string | null
          received_by?: string | null
          requested_at?: string | null
          requested_by?: string
          status?: string | null
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          received_at?: string | null
          received_by?: string | null
          requested_at?: string | null
          requested_by?: string
          status?: string | null
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requested_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requested_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requested_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requested_purchases_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          permission_key: string
          permission_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          permission_key: string
          permission_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          permission_key?: string
          permission_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          cadete_id: string
          completed_deliveries: number | null
          created_at: string
          end_time: string | null
          id: string
          route_date: string
          route_name: string
          start_time: string | null
          total_deliveries: number | null
          updated_at: string
        }
        Insert: {
          cadete_id: string
          completed_deliveries?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          route_date: string
          route_name: string
          start_time?: string | null
          total_deliveries?: number | null
          updated_at?: string
        }
        Update: {
          cadete_id?: string
          completed_deliveries?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          route_date?: string
          route_name?: string
          start_time?: string | null
          total_deliveries?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          location_id: string | null
          margin_percentage: number | null
          notes: string | null
          product_id: string
          quantity: number
          sale_date: string
          seller_id: string
          total_amount: number | null
          total_cost: number | null
          total_profit: number | null
          unit_cost: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          location_id?: string | null
          margin_percentage?: number | null
          notes?: string | null
          product_id: string
          quantity?: number
          sale_date: string
          seller_id: string
          total_amount?: number | null
          total_cost?: number | null
          total_profit?: number | null
          unit_cost: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          location_id?: string | null
          margin_percentage?: number | null
          notes?: string | null
          product_id?: string
          quantity?: number
          sale_date?: string
          seller_id?: string
          total_amount?: number | null
          total_cost?: number | null
          total_profit?: number | null
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payment_checks: {
        Row: {
          amount: number
          check_due_date: string | null
          check_image_url: string | null
          check_number: string
          created_at: string | null
          id: string
          supplier_payment_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          check_due_date?: string | null
          check_image_url?: string | null
          check_number: string
          created_at?: string | null
          id?: string
          supplier_payment_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          check_due_date?: string | null
          check_image_url?: string | null
          check_number?: string
          created_at?: string | null
          id?: string
          supplier_payment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payment_checks_supplier_payment_id_fkey"
            columns: ["supplier_payment_id"]
            isOneToOne: false
            referencedRelation: "supplier_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          check_due_date: string | null
          check_image_url: string | null
          check_number: string | null
          created_at: string
          created_by: string
          due_date: string
          id: string
          is_check: boolean
          notes: string | null
          paid_at: string | null
          payment_date: string
          payment_method: string
          payment_status: string
          purchase_id: string
          receipt_url: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          check_due_date?: string | null
          check_image_url?: string | null
          check_number?: string | null
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          is_check?: boolean
          notes?: string | null
          paid_at?: string | null
          payment_date: string
          payment_method?: string
          payment_status?: string
          purchase_id: string
          receipt_url?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          check_due_date?: string | null
          check_image_url?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          is_check?: boolean
          notes?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_method?: string
          payment_status?: string
          purchase_id?: string
          receipt_url?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_payments_purchase"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_payments_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          default_payment_days: number | null
          default_payment_method: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          payment_terms: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          default_payment_days?: number | null
          default_payment_method?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          payment_terms?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          default_payment_days?: number | null
          default_payment_method?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_terms?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          cadete_id: string
          color: string | null
          created_at: string
          id: string
          insurance_company: string | null
          insurance_expiry: string | null
          insurance_policy: string | null
          license_plate: string
          model: string
          notes: string | null
          status: string
          technical_inspection_expiry: string | null
          updated_at: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          brand: string
          cadete_id: string
          color?: string | null
          created_at?: string
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy?: string | null
          license_plate: string
          model: string
          notes?: string | null
          status?: string
          technical_inspection_expiry?: string | null
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Update: {
          brand?: string
          cadete_id?: string
          color?: string | null
          created_at?: string
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy?: string | null
          license_plate?: string
          model?: string
          notes?: string | null
          status?: string
          technical_inspection_expiry?: string | null
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_cadete_id_fkey"
            columns: ["cadete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_customer_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      delivery_status:
        | "pendiente"
        | "en_camino"
        | "entregado"
        | "con_demora"
        | "no_entregado"
      incident_type:
        | "reclamo"
        | "problema_entrega"
        | "direccion_incorrecta"
        | "cliente_ausente"
        | "otro"
      notification_type:
        | "nuevo_pedido"
        | "pedido_asignado"
        | "entrega_completada"
        | "entrega_fallida"
        | "incidencia_creada"
        | "incidencia_resuelta"
        | "ruta_creada"
        | "ruta_iniciada"
        | "problema_pedido"
      order_status:
        | "pendiente"
        | "asignado"
        | "en_ruta"
        | "entregado"
        | "cancelado"
        | "pago_ingresado"
        | "pendiente_compra"
        | "movimiento_interno_pendiente"
        | "pendiente_confirmacion_transferencia"
        | "pendiente_envio"
        | "pendiente_retiro"
        | "armado"
      payment_method:
        | "efectivo"
        | "tarjeta"
        | "transferencia"
        | "cuenta_corriente"
        | "credito_moderna"
      payment_status: "pendiente" | "pagado" | "liquidado"
      user_role: "gerencia" | "vendedor" | "cadete"
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
      delivery_status: [
        "pendiente",
        "en_camino",
        "entregado",
        "con_demora",
        "no_entregado",
      ],
      incident_type: [
        "reclamo",
        "problema_entrega",
        "direccion_incorrecta",
        "cliente_ausente",
        "otro",
      ],
      notification_type: [
        "nuevo_pedido",
        "pedido_asignado",
        "entrega_completada",
        "entrega_fallida",
        "incidencia_creada",
        "incidencia_resuelta",
        "ruta_creada",
        "ruta_iniciada",
        "problema_pedido",
      ],
      order_status: [
        "pendiente",
        "asignado",
        "en_ruta",
        "entregado",
        "cancelado",
        "pago_ingresado",
        "pendiente_compra",
        "movimiento_interno_pendiente",
        "pendiente_confirmacion_transferencia",
        "pendiente_envio",
        "pendiente_retiro",
        "armado",
      ],
      payment_method: [
        "efectivo",
        "tarjeta",
        "transferencia",
        "cuenta_corriente",
        "credito_moderna",
      ],
      payment_status: ["pendiente", "pagado", "liquidado"],
      user_role: ["gerencia", "vendedor", "cadete"],
    },
  },
} as const
