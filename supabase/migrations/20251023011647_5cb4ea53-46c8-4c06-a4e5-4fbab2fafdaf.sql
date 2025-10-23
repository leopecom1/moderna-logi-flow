-- Add 'pendiente_retiro' to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pendiente_retiro';