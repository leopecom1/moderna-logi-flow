export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
  width?: number;
  height?: number;
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  image_id: number | null;
  weight?: number;
  weight_unit?: string;
}

export interface ShopifyOption {
  id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: 'active' | 'draft' | 'archived';
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  tags?: string;
  handle?: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyConfig {
  id: string;
  store_domain: string;
  access_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ProductMapping {
  id: string;
  woocommerce_product_id: number;
  shopify_product_id: number;
  woocommerce_product_name: string | null;
  shopify_product_name: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}
