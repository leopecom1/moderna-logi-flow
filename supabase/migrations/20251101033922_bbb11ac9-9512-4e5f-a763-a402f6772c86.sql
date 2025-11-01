-- Agregar campo de moneda a la tabla products
ALTER TABLE products 
ADD COLUMN currency VARCHAR(3) DEFAULT 'UYU' NOT NULL;

-- Migrar datos existentes (por defecto todos los productos son en UYU)
UPDATE products SET currency = 'UYU' WHERE currency IS NULL;

-- Agregar columnas opcionales a orders para tracking de conversión de moneda
ALTER TABLE orders 
ADD COLUMN currency_rate NUMERIC(10,4),
ADD COLUMN exchange_rate_date TIMESTAMP WITH TIME ZONE;

-- Comentario para documentar el propósito
COMMENT ON COLUMN products.currency IS 'Moneda del producto: UYU (Pesos Uruguayos) o USD (Dólares)';
COMMENT ON COLUMN orders.currency_rate IS 'Tipo de cambio USD a UYU utilizado al momento de crear la orden';
COMMENT ON COLUMN orders.exchange_rate_date IS 'Fecha y hora en que se obtuvo el tipo de cambio';