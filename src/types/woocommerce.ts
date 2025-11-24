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

export interface WooCommerceAttribute {
  id?: number;
  name: string;
  position?: number;
  visible?: boolean;
  variation?: boolean;
  options: string[];
}

export interface WooCommerceVariation {
  id: number;
  sku?: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock';
  manage_stock: boolean;
  image?: WooCommerceImage;
  attributes: Array<{
    name: string;
    option: string;
  }>;
}

export interface WooCommerceVariationCreate {
  sku?: string;
  regular_price: string;
  sale_price?: string;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock';
  manage_stock?: boolean;
  image?: { src: string };
  attributes: Array<{
    name: string;
    option: string;
  }>;
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
  attributes?: WooCommerceAttribute[];
  variations?: number[];
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
  attributes?: WooCommerceAttribute[];
}

export interface WooCommerceCategoryCreate {
  name: string;
  slug?: string;
  parent?: number;
  description?: string;
}
