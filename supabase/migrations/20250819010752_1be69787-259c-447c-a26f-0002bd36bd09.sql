-- Add foreign key constraint between purchase_items and products
ALTER TABLE purchase_items 
ADD CONSTRAINT fk_purchase_items_product_id 
FOREIGN KEY (product_id) 
REFERENCES products(id);