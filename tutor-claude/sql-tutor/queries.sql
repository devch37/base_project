-- SQL Tutor Queries (Basic -> Advanced)

-- 1) Basic: active users with signup date
SELECT user_id, email, full_name, created_at
FROM users
WHERE status = 'ACTIVE'
ORDER BY created_at DESC;

-- 2) Basic join: orders with payment status and amount
SELECT o.order_id, o.user_id, o.order_status, p.status AS payment_status, p.amount
FROM orders o
LEFT JOIN payments p ON p.order_id = o.order_id
ORDER BY o.placed_at DESC;

-- 3) Basic aggregation: total revenue by day
SELECT DATE(o.placed_at) AS order_date,
       SUM(o.order_total) AS revenue
FROM orders o
WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
GROUP BY DATE(o.placed_at)
ORDER BY order_date;

-- 4) Join + group: revenue by product
SELECT p.product_id, p.name,
       SUM(oi.unit_price * oi.quantity) AS revenue
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN orders o ON o.order_id = oi.order_id
WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
GROUP BY p.product_id, p.name
ORDER BY revenue DESC;

-- 5) Multi-join: category revenue contribution
SELECT c.name AS category,
       SUM(oi.unit_price * oi.quantity) AS revenue
FROM categories c
JOIN product_categories pc ON pc.category_id = c.category_id
JOIN products p ON p.product_id = pc.product_id
JOIN order_items oi ON oi.product_id = p.product_id
JOIN orders o ON o.order_id = oi.order_id
WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
GROUP BY c.name
ORDER BY revenue DESC;

-- 6) HAVING: customers with 2+ paid orders
SELECT o.user_id, COUNT(*) AS paid_orders
FROM orders o
WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
GROUP BY o.user_id
HAVING COUNT(*) >= 2;

-- 7) Window: rank products by revenue within category
WITH product_revenue AS (
    SELECT c.name AS category, p.product_id, p.name,
           SUM(oi.unit_price * oi.quantity) AS revenue
    FROM categories c
    JOIN product_categories pc ON pc.category_id = c.category_id
    JOIN products p ON p.product_id = pc.product_id
    JOIN order_items oi ON oi.product_id = p.product_id
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY c.name, p.product_id, p.name
)
SELECT category, product_id, name, revenue,
       RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS revenue_rank
FROM product_revenue
ORDER BY category, revenue_rank;

-- 8) Window: cumulative revenue by day
WITH daily AS (
    SELECT DATE(placed_at) AS dt, SUM(order_total) AS revenue
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY DATE(placed_at)
)
SELECT dt, revenue,
       SUM(revenue) OVER (ORDER BY dt) AS cumulative_revenue
FROM daily
ORDER BY dt;

-- 9) Moving average (7-day)
WITH daily AS (
    SELECT DATE(placed_at) AS dt, SUM(order_total) AS revenue
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY DATE(placed_at)
)
SELECT dt, revenue,
       AVG(revenue) OVER (ORDER BY dt ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma7
FROM daily
ORDER BY dt;

-- 10) Percentiles: order total distribution
SELECT
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY order_total) AS p50,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY order_total) AS p90,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY order_total) AS p99
FROM orders;

-- 11) RFM segmentation
WITH rfm AS (
    SELECT
        u.user_id,
        MAX(o.placed_at) AS last_order,
        COUNT(o.order_id) AS frequency,
        COALESCE(SUM(o.order_total), 0) AS monetary
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.user_id
    GROUP BY u.user_id
),
scores AS (
    SELECT *,
           NTILE(5) OVER (ORDER BY last_order DESC NULLS LAST) AS recency_score,
           NTILE(5) OVER (ORDER BY frequency DESC) AS frequency_score,
           NTILE(5) OVER (ORDER BY monetary DESC) AS monetary_score
    FROM rfm
)
SELECT user_id, recency_score, frequency_score, monetary_score,
       (recency_score + frequency_score + monetary_score) AS rfm_score
FROM scores
ORDER BY rfm_score DESC;

-- 12) Cohort retention (by first order month)
WITH first_order AS (
    SELECT user_id, DATE_TRUNC('month', MIN(placed_at)) AS cohort_month
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id
),
activity AS (
    SELECT o.user_id,
           DATE_TRUNC('month', o.placed_at) AS activity_month
    FROM orders o
    WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
),
cohort_activity AS (
    SELECT f.cohort_month, a.activity_month,
           COUNT(DISTINCT a.user_id) AS active_users
    FROM first_order f
    JOIN activity a ON a.user_id = f.user_id
    GROUP BY f.cohort_month, a.activity_month
)
SELECT cohort_month,
       activity_month,
       active_users,
       EXTRACT(MONTH FROM AGE(activity_month, cohort_month)) AS months_since_cohort
FROM cohort_activity
ORDER BY cohort_month, activity_month;

-- 13) Funnel conversion (session level)
WITH session_steps AS (
    SELECT session_id,
           MAX(CASE WHEN event_type = 'VIEW' THEN 1 ELSE 0 END) AS viewed,
           MAX(CASE WHEN event_type = 'ADD_TO_CART' THEN 1 ELSE 0 END) AS added,
           MAX(CASE WHEN event_type = 'CHECKOUT' THEN 1 ELSE 0 END) AS checkout,
           MAX(CASE WHEN event_type = 'PURCHASE' THEN 1 ELSE 0 END) AS purchase
    FROM web_events
    GROUP BY session_id
)
SELECT
    COUNT(*) AS sessions,
    SUM(viewed) AS viewed_sessions,
    SUM(added) AS cart_sessions,
    SUM(checkout) AS checkout_sessions,
    SUM(purchase) AS purchase_sessions
FROM session_steps;

-- 14) Data quality: orders with missing payments or shipments
SELECT o.order_id, o.order_status
FROM orders o
LEFT JOIN payments p ON p.order_id = o.order_id
LEFT JOIN shipments s ON s.order_id = o.order_id
WHERE (o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED') AND p.payment_id IS NULL)
   OR (o.order_status = 'SHIPPED' AND s.shipment_id IS NULL);

-- 15) Inventory coverage: days of stock assuming last 30d sales rate
WITH sales AS (
    SELECT oi.product_id,
           SUM(oi.quantity) AS sold_30d
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.placed_at >= NOW() - INTERVAL '30 days'
      AND o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY oi.product_id
),
stock AS (
    SELECT product_id, SUM(on_hand - reserved) AS available
    FROM inventory
    GROUP BY product_id
)
SELECT p.product_id, p.name, s.available,
       COALESCE(sales.sold_30d, 0) AS sold_30d,
       CASE WHEN COALESCE(sales.sold_30d, 0) = 0 THEN NULL
            ELSE ROUND(s.available::numeric / (sales.sold_30d / 30.0), 2)
       END AS days_of_stock
FROM products p
LEFT JOIN stock s ON s.product_id = p.product_id
LEFT JOIN sales ON sales.product_id = p.product_id
ORDER BY days_of_stock NULLS LAST;

-- 16) Customer LTV (simplified)
SELECT o.user_id,
       SUM(o.order_total) AS lifetime_value,
       COUNT(*) AS total_orders,
       MIN(o.placed_at) AS first_order,
       MAX(o.placed_at) AS last_order
FROM orders o
WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
GROUP BY o.user_id
ORDER BY lifetime_value DESC;

-- 17) Repeat purchase rate by month
WITH monthly_orders AS (
    SELECT user_id, DATE_TRUNC('month', placed_at) AS month, COUNT(*) AS cnt
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id, DATE_TRUNC('month', placed_at)
)
SELECT month,
       COUNT(*) FILTER (WHERE cnt >= 2) AS repeat_customers,
       COUNT(*) AS active_customers,
       ROUND(100.0 * COUNT(*) FILTER (WHERE cnt >= 2) / NULLIF(COUNT(*), 0), 2) AS repeat_rate_pct
FROM monthly_orders
GROUP BY month
ORDER BY month;

-- 18) Detect abnormal refunds (refund > 50% of customer total)
WITH customer_totals AS (
    SELECT user_id,
           SUM(CASE WHEN order_status IN ('PAID', 'SHIPPED') THEN order_total ELSE 0 END) AS paid_total,
           SUM(CASE WHEN order_status = 'REFUNDED' THEN order_total ELSE 0 END) AS refunded_total
    FROM orders
    GROUP BY user_id
)
SELECT user_id, paid_total, refunded_total
FROM customer_totals
WHERE refunded_total > paid_total * 0.5;

-- 19) Top 3 products per supplier by revenue
WITH supplier_revenue AS (
    SELECT s.supplier_id, s.name AS supplier_name, p.product_id, p.name,
           SUM(oi.unit_price * oi.quantity) AS revenue
    FROM suppliers s
    JOIN products p ON p.supplier_id = s.supplier_id
    JOIN order_items oi ON oi.product_id = p.product_id
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY s.supplier_id, s.name, p.product_id, p.name
)
SELECT *
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY supplier_id ORDER BY revenue DESC) AS rn
    FROM supplier_revenue
) ranked
WHERE rn <= 3
ORDER BY supplier_name, rn;

-- 20) Basket analysis: frequently co-purchased products
WITH pairs AS (
    SELECT a.order_id, a.product_id AS product_a, b.product_id AS product_b
    FROM order_items a
    JOIN order_items b ON a.order_id = b.order_id AND a.product_id < b.product_id
)
SELECT product_a, product_b, COUNT(*) AS co_purchase_count
FROM pairs
GROUP BY product_a, product_b
HAVING COUNT(*) >= 1
ORDER BY co_purchase_count DESC;

-- 21) Product rating distribution
SELECT p.name,
       AVG(r.rating) AS avg_rating,
       COUNT(*) AS review_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.product_id
GROUP BY p.name
ORDER BY avg_rating DESC NULLS LAST;

-- 22) Coupon effectiveness: revenue with vs without coupon
WITH coupon_orders AS (
    SELECT DISTINCT order_id FROM order_coupons
)
SELECT
    CASE WHEN c.order_id IS NULL THEN 'NO_COUPON' ELSE 'COUPON' END AS segment,
    COUNT(*) AS orders,
    SUM(o.order_total) AS revenue
FROM orders o
LEFT JOIN coupon_orders c ON c.order_id = o.order_id
GROUP BY segment;

-- 23) Time-to-ship and time-to-deliver
SELECT o.order_id,
       s.shipped_at - o.placed_at AS time_to_ship,
       s.delivered_at - s.shipped_at AS time_to_deliver
FROM orders o
JOIN shipments s ON s.order_id = o.order_id;

-- 24) Event to order linkage: sessions leading to purchases
WITH session_purchase AS (
    SELECT DISTINCT session_id
    FROM web_events
    WHERE event_type = 'PURCHASE'
)
SELECT s.session_id, s.user_id, s.started_at
FROM web_sessions s
JOIN session_purchase p ON p.session_id = s.session_id;

-- 25) Daily active users (DAU) from web events
SELECT DATE(occurred_at) AS dt, COUNT(DISTINCT session_id) AS dau
FROM web_events
GROUP BY DATE(occurred_at)
ORDER BY dt;

-- 26) Recursive CTE: generate last 14 days calendar with zero-filled revenue
WITH RECURSIVE dates AS (
    SELECT DATE(NOW() - INTERVAL '13 days') AS dt
    UNION ALL
    SELECT dt + INTERVAL '1 day'
    FROM dates
    WHERE dt < DATE(NOW())
),
daily AS (
    SELECT DATE(placed_at) AS dt, SUM(order_total) AS revenue
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY DATE(placed_at)
)
SELECT d.dt, COALESCE(r.revenue, 0) AS revenue
FROM dates d
LEFT JOIN daily r ON r.dt = d.dt
ORDER BY d.dt;

-- 27) Customer purchase cadence (avg days between orders)
WITH ordered AS (
    SELECT user_id, placed_at,
           LAG(placed_at) OVER (PARTITION BY user_id ORDER BY placed_at) AS prev_order
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
)
SELECT user_id,
       AVG(placed_at - prev_order) AS avg_days_between_orders
FROM ordered
WHERE prev_order IS NOT NULL
GROUP BY user_id;

-- 28) Detect price anomalies (price vs category average)
WITH category_avg AS (
    SELECT c.category_id, AVG(p.price) AS avg_price
    FROM categories c
    JOIN product_categories pc ON pc.category_id = c.category_id
    JOIN products p ON p.product_id = pc.product_id
    GROUP BY c.category_id
)
SELECT p.product_id, p.name, p.price, ca.avg_price
FROM products p
JOIN product_categories pc ON pc.product_id = p.product_id
JOIN category_avg ca ON ca.category_id = pc.category_id
WHERE p.price > ca.avg_price * 2;

-- 29) Orders with inconsistent totals (sum of items != order_total)
SELECT o.order_id, o.order_total,
       SUM(oi.unit_price * oi.quantity) AS items_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.order_id, o.order_total
HAVING SUM(oi.unit_price * oi.quantity) <> o.order_total;

-- 30) Supplier performance: item revenue + avg delivery time
WITH supplier_item_revenue AS (
    SELECT s.supplier_id, s.name AS supplier_name,
           SUM(oi.unit_price * oi.quantity) AS revenue
    FROM suppliers s
    JOIN products p ON p.supplier_id = s.supplier_id
    JOIN order_items oi ON oi.product_id = p.product_id
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY s.supplier_id, s.name
),
supplier_delivery AS (
    SELECT s.supplier_id,
           AVG(sh.delivered_at - sh.shipped_at) AS avg_delivery_time
    FROM suppliers s
    JOIN products p ON p.supplier_id = s.supplier_id
    JOIN order_items oi ON oi.product_id = p.product_id
    JOIN shipments sh ON sh.order_id = oi.order_id
    GROUP BY s.supplier_id
)
SELECT r.supplier_name, r.revenue, d.avg_delivery_time
FROM supplier_item_revenue r
LEFT JOIN supplier_delivery d ON d.supplier_id = r.supplier_id
ORDER BY r.revenue DESC;
