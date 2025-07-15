-- Crear un nuevo pedido para pruebas
INSERT INTO orders (
  order_number, 
  customer_id, 
  seller_id, 
  delivery_address, 
  total_amount, 
  payment_method, 
  status, 
  products
) VALUES (
  'PED-' || FLOOR(RANDOM() * 100000000)::text,
  '21d46235-fd31-4585-a419-f4842a0f411c',
  '193165f2-98d7-4457-8679-0467a48dc08f',
  'Av. Brasil 2500, Montevideo',
  250.00,
  'efectivo',
  'pendiente',
  '[{"name": "Producto de Prueba", "quantity": 2, "price": 125.00}]'::jsonb
);