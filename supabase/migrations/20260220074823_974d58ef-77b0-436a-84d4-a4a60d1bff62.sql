
-- Clean all dependent tables
DELETE FROM assembly_photos;
DELETE FROM incidents;
DELETE FROM deliveries;
DELETE FROM card_liquidations;
DELETE FROM credit_moderna_installments;
DELETE FROM collections;
DELETE FROM payments;
DELETE FROM requested_purchases;
DELETE FROM inventory_movements;
DELETE FROM inventory_items;
DELETE FROM product_variants;
DELETE FROM purchase_items;
DELETE FROM ecommerce_campaign_products;
DELETE FROM ecommerce_campaign_variations;
DELETE FROM supplier_payments;

-- Clean main tables
DELETE FROM orders;
DELETE FROM purchases;
DELETE FROM products;
