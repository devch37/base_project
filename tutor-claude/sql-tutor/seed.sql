-- Dummy data (small but coherent)

INSERT INTO users (user_id, email, full_name, status, created_at)
VALUES
    (1, 'alice@example.com', 'Alice Kim', 'ACTIVE', NOW() - INTERVAL 120 DAY),
    (2, 'bob@example.com', 'Bob Lee', 'ACTIVE', NOW() - INTERVAL 90 DAY),
    (3, 'chris@example.com', 'Chris Park', 'SUSPENDED', NOW() - INTERVAL 60 DAY),
    (4, 'diana@example.com', 'Diana Choi', 'ACTIVE', NOW() - INTERVAL 30 DAY),
    (5, 'edward@example.com', 'Edward Han', 'ACTIVE', NOW() - INTERVAL 10 DAY);

INSERT INTO addresses (address_id, user_id, country, city, postal_code, line1, line2, is_default)
VALUES
    (1, 1, 'KR', 'Seoul', '04500', 'Line 1', NULL, TRUE),
    (2, 2, 'KR', 'Busan', '48000', 'Line 1', NULL, TRUE),
    (3, 4, 'US', 'Seattle', '98101', 'Line 1', NULL, TRUE);

INSERT INTO suppliers (supplier_id, name, country)
VALUES
    (1, 'Korea Supply', 'KR'),
    (2, 'Global Supply', 'US');

INSERT INTO categories (category_id, name)
VALUES
    (1, 'Electronics'),
    (2, 'Home'),
    (3, 'Books');

INSERT INTO products (product_id, supplier_id, sku, name, price, is_active, created_at)
VALUES
    (1, 1, 'SKU-100', 'Laptop', 1200.00, TRUE, NOW() - INTERVAL 200 DAY),
    (2, 1, 'SKU-101', 'Mouse', 25.00, TRUE, NOW() - INTERVAL 180 DAY),
    (3, 2, 'SKU-200', 'Coffee Maker', 95.00, TRUE, NOW() - INTERVAL 150 DAY),
    (4, 2, 'SKU-201', 'Book Light', 15.00, TRUE, NOW() - INTERVAL 90 DAY),
    (5, 2, 'SKU-300', 'Novel', 12.00, TRUE, NOW() - INTERVAL 60 DAY),
    (6, 1, 'SKU-400', 'Keyboard', 55.00, TRUE, NOW() - INTERVAL 40 DAY);

INSERT INTO product_categories (product_id, category_id) VALUES
    (1, 1),
    (2, 1),
    (3, 2),
    (4, 2),
    (5, 3),
    (6, 1);

INSERT INTO warehouses (warehouse_id, name, country)
VALUES
    (1, 'Seoul-WH', 'KR'),
    (2, 'LA-WH', 'US');

INSERT INTO inventory (warehouse_id, product_id, on_hand, reserved) VALUES
    (1, 1, 10, 2),
    (1, 2, 200, 10),
    (1, 6, 80, 5),
    (2, 3, 50, 3),
    (2, 4, 150, 0),
    (2, 5, 300, 2);

INSERT INTO orders (order_id, user_id, order_status, order_total, placed_at)
VALUES
    (1, 1, 'PAID', 1250.00, NOW() - INTERVAL 40 DAY),
    (2, 2, 'SHIPPED', 95.00, NOW() - INTERVAL 20 DAY),
    (3, 1, 'CANCELLED', 25.00, NOW() - INTERVAL 10 DAY),
    (4, 4, 'PAID', 70.00, NOW() - INTERVAL 7 DAY),
    (5, 5, 'CREATED', 12.00, NOW() - INTERVAL 2 DAY),
    (6, 2, 'REFUNDED', 1200.00, NOW() - INTERVAL 1 DAY);

INSERT INTO order_items (order_item_id, order_id, product_id, unit_price, quantity)
VALUES
    (1, 1, 1, 1200.00, 1),
    (2, 1, 2, 25.00, 2),
    (3, 2, 3, 95.00, 1),
    (4, 3, 2, 25.00, 1),
    (5, 4, 6, 55.00, 1),
    (6, 4, 4, 15.00, 1),
    (7, 5, 5, 12.00, 1),
    (8, 6, 1, 1200.00, 1);

INSERT INTO payments (payment_id, order_id, amount, method, status, paid_at)
VALUES
    (1, 1, 1250.00, 'CARD', 'APPROVED', NOW() - INTERVAL 40 DAY),
    (2, 2, 95.00, 'BANK', 'APPROVED', NOW() - INTERVAL 20 DAY),
    (3, 3, 25.00, 'CARD', 'DECLINED', NOW() - INTERVAL 10 DAY),
    (4, 4, 70.00, 'WALLET', 'APPROVED', NOW() - INTERVAL 7 DAY),
    (5, 6, 1200.00, 'CARD', 'REFUNDED', NOW() - INTERVAL 1 DAY);

INSERT INTO shipments (shipment_id, order_id, warehouse_id, carrier, tracking_no, shipped_at, delivered_at)
VALUES
    (1, 1, 1, 'CJ', 'TRK-001', NOW() - INTERVAL 39 DAY, NOW() - INTERVAL 35 DAY),
    (2, 2, 2, 'UPS', 'TRK-002', NOW() - INTERVAL 19 DAY, NOW() - INTERVAL 14 DAY);

INSERT INTO returns (return_id, order_id, reason, status, requested_at)
VALUES
    (1, 6, 'DEFECT', 'RECEIVED', NOW() - INTERVAL 1 DAY);

INSERT INTO coupons (coupon_id, code, discount_pct, is_active)
VALUES
    (1, 'WELCOME10', 10.00, TRUE),
    (2, 'SPRING20', 20.00, TRUE);

INSERT INTO order_coupons (order_id, coupon_id) VALUES
    (1, 1),
    (4, 2);

INSERT INTO reviews (review_id, product_id, user_id, rating, review_text, created_at)
VALUES
    (1, 1, 1, 5, 'Great laptop', NOW() - INTERVAL 30 DAY),
    (2, 2, 1, 4, 'Good mouse', NOW() - INTERVAL 25 DAY),
    (3, 3, 2, 3, 'Ok', NOW() - INTERVAL 10 DAY),
    (4, 5, 5, 5, 'Loved it', NOW() - INTERVAL 1 DAY);

INSERT INTO web_sessions (session_id, user_id, started_at) VALUES
    ('s1', 1, NOW() - INTERVAL 2 DAY),
    ('s2', 2, NOW() - INTERVAL 2 DAY),
    ('s3', 4, NOW() - INTERVAL 1 DAY),
    ('s4', NULL, NOW() - INTERVAL 1 DAY);

INSERT INTO web_events (event_id, session_id, event_type, product_id, occurred_at)
VALUES
    (1, 's1', 'VIEW', 1, NOW() - INTERVAL 2 DAY),
    (2, 's1', 'ADD_TO_CART', 1, NOW() - INTERVAL 2 DAY),
    (3, 's1', 'CHECKOUT', NULL, NOW() - INTERVAL 2 DAY),
    (4, 's1', 'PURCHASE', 1, NOW() - INTERVAL 2 DAY),
    (5, 's2', 'VIEW', 3, NOW() - INTERVAL 2 DAY),
    (6, 's2', 'ADD_TO_CART', 3, NOW() - INTERVAL 2 DAY),
    (7, 's3', 'VIEW', 5, NOW() - INTERVAL 1 DAY),
    (8, 's4', 'VIEW', 2, NOW() - INTERVAL 1 DAY);
