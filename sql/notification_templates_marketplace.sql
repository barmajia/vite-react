-- Marketplace-related notification templates for the web marketplace
INSERT INTO public.notification_templates (name, title_template, message_template, type, priority, enabled, action_url_template) VALUES
('webmarketplace_new_deal','New deal: {{deal_title}}','A new deal for {{product_name}} has been created by {{seller_name}}. Deal: {{deal_id}}', 'deal','high', true, '/deals/{{deal_slug}}'),
('webmarketplace_deal_status','Deal update: {{deal_title}}','Deal {{deal_id}} status: {{status}}', 'deal','medium', true, '/deals/{{deal_slug}}'),
('webmarketplace_order_confirmed','Order confirmed: {{order_id}}','Your order {{order_id}} has been confirmed. Total: {{total}}', 'order','high', true, '/orders/{{order_id}}'),
('webmarketplace_shipping_update','Shipping update: {{order_id}}','Your order {{order_id}} is now {{status}}. Carrier: {{carrier}}', 'shipping','medium', true, '/orders/{{order_id}}/shipping'),
('webmarketplace_promo_applied','Promo applied: {{promo_code}}','You saved {{discount}} on {{product_name}} with code {{promo_code}}', 'promotion','low', true, '/promotions/{{promo_code}}'),
('webmarketplace_product_restock','Product restocked: {{product_name}}','{{product_name}} is back in stock. Quantity: {{quantity}}.', 'product','low', true, '/products/{{product_id}}'),
('webmarketplace_seller_message','New message from {{seller_name}}','{{message_excerpt}}', 'message','high', true, '/conversations/{{conversation_id}}'),
('webmarketplace_review_received','New review for {{product_name}}','New review by {{customer_name}}: "{{review_text}}"', 'review','low', true, '/reviews/{{product_id}}'),
('webmarketplace_payment_failed','Payment failed for order {{order_id}}','Your payment for order {{order_id}} failed. Reason: {{reason}}', 'payment','high', true, '/orders/{{order_id}}/payments');
