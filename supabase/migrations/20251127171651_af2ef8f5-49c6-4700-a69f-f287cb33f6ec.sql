-- Crear tabla para configuración de Shopify
CREATE TABLE IF NOT EXISTS shopify_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_domain TEXT NOT NULL,
    access_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE shopify_config ENABLE ROW LEVEL SECURITY;

-- Políticas para shopify_config
CREATE POLICY "Authenticated users can view shopify config"
    ON shopify_config FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Gerencia can manage shopify config"
    ON shopify_config FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'gerencia');

-- Crear tabla para mapeos de productos
CREATE TABLE IF NOT EXISTS product_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    woocommerce_product_id INTEGER NOT NULL,
    shopify_product_id BIGINT NOT NULL,
    woocommerce_product_name TEXT,
    shopify_product_name TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(woocommerce_product_id),
    UNIQUE(shopify_product_id)
);

-- Habilitar RLS
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas para product_mappings
CREATE POLICY "Authenticated users can view product mappings"
    ON product_mappings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Gerencia and vendedores can manage product mappings"
    ON product_mappings FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = ANY(ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

-- Trigger para updated_at en shopify_config
CREATE TRIGGER update_shopify_config_updated_at
    BEFORE UPDATE ON shopify_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en product_mappings
CREATE TRIGGER update_product_mappings_updated_at
    BEFORE UPDATE ON product_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();