export interface WooCommerceImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'variable' | 'grouped';
  status: 'publish' | 'draft';
  featured: boolean;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock';
  manage_stock: boolean;
  stock_quantity: number | null;
  categories: WooCommerceCategory[];
  images: WooCommerceImage[];
}

export interface WooCommerceProductCreate {
  name: string;
  type?: 'simple' | 'variable' | 'grouped';
  status?: 'publish' | 'draft';
  featured?: boolean;
  description?: string;
  short_description?: string;
  sku?: string;
  regular_price: string;
  sale_price?: string;
  stock_status?: 'instock' | 'outofstock';
  manage_stock?: boolean;
  stock_quantity?: number;
  categories?: { id: number }[];
  images?: { src: string }[];
}

export interface WooCommerceCategoryCreate {
  name: string;
  slug?: string;
  parent?: number;
  description?: string;
}
