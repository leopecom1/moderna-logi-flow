-- Add field to track if assembler will deliver
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armador_entrega_mercaderia boolean DEFAULT false;