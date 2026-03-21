-- SQL Tutor Answers (MySQL 8.0+)

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
WITH ordered AS (
    SELECT order_total,
           ROW_NUMBER() OVER (ORDER BY order_total) AS rn,
           COUNT(*) OVER () AS cnt
    FROM orders
)
SELECT
    MAX(CASE WHEN rn = CEIL(0.50 * cnt) THEN order_total END) AS p50,
    MAX(CASE WHEN rn = CEIL(0.90 * cnt) THEN order_total END) AS p90,
    MAX(CASE WHEN rn = CEIL(0.99 * cnt) THEN order_total END) AS p99
FROM ordered;

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
           NTILE(5) OVER (ORDER BY (last_order IS NULL), last_order DESC) AS recency_score,
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
    SELECT user_id,
           DATE_SUB(DATE(MIN(placed_at)), INTERVAL DAY(MIN(placed_at)) - 1 DAY) AS cohort_month
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id
),
activity AS (
    SELECT o.user_id,
           DATE_SUB(DATE(o.placed_at), INTERVAL DAY(o.placed_at) - 1 DAY) AS activity_month
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
       TIMESTAMPDIFF(MONTH, cohort_month, activity_month) AS months_since_cohort
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
    WHERE o.placed_at >= NOW() - INTERVAL 30 DAY
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
            ELSE ROUND(CAST(s.available AS DECIMAL(12,2)) / (sales.sold_30d / 30.0), 2)
       END AS days_of_stock
FROM products p
LEFT JOIN stock s ON s.product_id = p.product_id
LEFT JOIN sales ON sales.product_id = p.product_id
ORDER BY days_of_stock IS NULL, days_of_stock;

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
    SELECT user_id,
           DATE_SUB(DATE(placed_at), INTERVAL DAY(placed_at) - 1 DAY) AS month,
           COUNT(*) AS cnt
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id, DATE_SUB(DATE(placed_at), INTERVAL DAY(placed_at) - 1 DAY)
)
SELECT month,
       SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) AS repeat_customers,
       COUNT(*) AS active_customers,
       ROUND(100.0 * SUM(CASE WHEN cnt >= 2 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS repeat_rate_pct
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
ORDER BY (avg_rating IS NULL), avg_rating DESC;

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

-- 23) Time-to-ship and time-to-deliver (hours)
SELECT o.order_id,
       TIMESTAMPDIFF(HOUR, o.placed_at, s.shipped_at) AS hours_to_ship,
       TIMESTAMPDIFF(HOUR, s.shipped_at, s.delivered_at) AS hours_to_deliver
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
    SELECT DATE(NOW() - INTERVAL 13 DAY) AS dt
    UNION ALL
    SELECT dt + INTERVAL 1 DAY
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
       AVG(DATEDIFF(placed_at, prev_order)) AS avg_days_between_orders
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

-- 30) Supplier performance: item revenue + avg delivery time (hours)
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
           AVG(TIMESTAMPDIFF(HOUR, sh.shipped_at, sh.delivered_at)) AS avg_delivery_hours
    FROM suppliers s
    JOIN products p ON p.supplier_id = s.supplier_id
    JOIN order_items oi ON oi.product_id = p.product_id
    JOIN shipments sh ON sh.order_id = oi.order_id
    GROUP BY s.supplier_id
)
SELECT r.supplier_name, r.revenue, d.avg_delivery_hours
FROM supplier_item_revenue r
LEFT JOIN supplier_delivery d ON d.supplier_id = r.supplier_id
ORDER BY r.revenue DESC;

-- 31) Cohort revenue curve
WITH first_order AS (
    SELECT user_id,
           DATE_SUB(DATE(MIN(placed_at)), INTERVAL DAY(MIN(placed_at)) - 1 DAY) AS cohort_month
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id
),
activity AS (
    SELECT o.user_id,
           DATE_SUB(DATE(o.placed_at), INTERVAL DAY(o.placed_at) - 1 DAY) AS activity_month,
           o.order_total
    FROM orders o
    WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
),
cohort_revenue AS (
    SELECT f.cohort_month,
           a.activity_month,
           SUM(a.order_total) AS revenue
    FROM first_order f
    JOIN activity a ON a.user_id = f.user_id
    GROUP BY f.cohort_month, a.activity_month
)
SELECT cohort_month,
       activity_month,
       TIMESTAMPDIFF(MONTH, cohort_month, activity_month) AS months_since_cohort,
       revenue
FROM cohort_revenue
ORDER BY cohort_month, activity_month;

-- 32) Churn risk users
WITH recent_orders AS (
    SELECT user_id,
           SUM(CASE WHEN placed_at >= NOW() - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS orders_last_30,
           SUM(CASE WHEN placed_at < NOW() - INTERVAL 30 DAY
                     AND placed_at >= NOW() - INTERVAL 60 DAY THEN 1 ELSE 0 END) AS orders_prev_30
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id
)
SELECT user_id, orders_prev_30, orders_last_30
FROM recent_orders
WHERE orders_prev_30 >= 2 AND orders_last_30 = 0;

-- 33) Product conversion rate (view -> purchase)
WITH views AS (
    SELECT product_id, COUNT(DISTINCT session_id) AS view_sessions
    FROM web_events
    WHERE event_type = 'VIEW' AND product_id IS NOT NULL
    GROUP BY product_id
),
purchases AS (
    SELECT product_id, COUNT(DISTINCT session_id) AS purchase_sessions
    FROM web_events
    WHERE event_type = 'PURCHASE' AND product_id IS NOT NULL
    GROUP BY product_id
)
SELECT p.product_id, p.name,
       v.view_sessions,
       COALESCE(pr.purchase_sessions, 0) AS purchase_sessions,
       ROUND(100.0 * COALESCE(pr.purchase_sessions, 0) / NULLIF(v.view_sessions, 0), 2) AS conversion_rate_pct
FROM views v
JOIN products p ON p.product_id = v.product_id
LEFT JOIN purchases pr ON pr.product_id = v.product_id
ORDER BY conversion_rate_pct DESC, v.view_sessions DESC;

-- 34) Cart abandonment rate
WITH session_steps AS (
    SELECT session_id,
           MAX(CASE WHEN event_type = 'ADD_TO_CART' THEN 1 ELSE 0 END) AS added,
           MAX(CASE WHEN event_type = 'PURCHASE' THEN 1 ELSE 0 END) AS purchase
    FROM web_events
    GROUP BY session_id
)
SELECT
    SUM(CASE WHEN added = 1 THEN 1 ELSE 0 END) AS cart_sessions,
    SUM(CASE WHEN added = 1 AND purchase = 0 THEN 1 ELSE 0 END) AS abandoned_sessions,
    ROUND(100.0 * SUM(CASE WHEN added = 1 AND purchase = 0 THEN 1 ELSE 0 END)
          / NULLIF(SUM(CASE WHEN added = 1 THEN 1 ELSE 0 END), 0), 2) AS abandonment_rate_pct
FROM session_steps;

-- 35) Top 20% customers by revenue and their cumulative share
WITH customer_revenue AS (
    SELECT user_id, SUM(order_total) AS revenue
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY user_id
),
ranked AS (
    SELECT user_id, revenue,
           ROW_NUMBER() OVER (ORDER BY revenue DESC) AS rn,
           COUNT(*) OVER () AS cnt,
           SUM(revenue) OVER (ORDER BY revenue DESC) AS cumulative_revenue,
           SUM(revenue) OVER () AS total_revenue
    FROM customer_revenue
)
SELECT user_id, revenue,
       ROUND(100.0 * cumulative_revenue / total_revenue, 2) AS cumulative_revenue_pct
FROM ranked
WHERE rn <= CEIL(0.20 * cnt)
ORDER BY revenue DESC;

-- 36) Month-over-month revenue growth
WITH monthly AS (
    SELECT DATE_SUB(DATE(placed_at), INTERVAL DAY(placed_at) - 1 DAY) AS month,
           SUM(order_total) AS revenue
    FROM orders
    WHERE order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY DATE_SUB(DATE(placed_at), INTERVAL DAY(placed_at) - 1 DAY)
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS mom_change,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2) AS mom_change_pct
FROM monthly
ORDER BY month;

-- 37) Median time-to-deliver by carrier (hours)
WITH delivery AS (
    SELECT carrier,
           TIMESTAMPDIFF(HOUR, shipped_at, delivered_at) AS hours_to_deliver
    FROM shipments
    WHERE shipped_at IS NOT NULL AND delivered_at IS NOT NULL
),
ranked AS (
    SELECT carrier, hours_to_deliver,
           ROW_NUMBER() OVER (PARTITION BY carrier ORDER BY hours_to_deliver) AS rn,
           COUNT(*) OVER (PARTITION BY carrier) AS cnt
    FROM delivery
)
SELECT carrier,
       MAX(CASE WHEN rn = CEIL(cnt / 2.0) THEN hours_to_deliver END) AS median_hours_to_deliver
FROM ranked
GROUP BY carrier;

-- 38) Stockout risk
WITH sales AS (
    SELECT oi.product_id,
           SUM(oi.quantity) AS sold_30d
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.placed_at >= NOW() - INTERVAL 30 DAY
      AND o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY oi.product_id
),
stock AS (
    SELECT product_id, SUM(on_hand - reserved) AS available
    FROM inventory
    GROUP BY product_id
)
SELECT p.product_id, p.name, s.available, sales.sold_30d
FROM products p
JOIN stock s ON s.product_id = p.product_id
JOIN sales ON sales.product_id = p.product_id
WHERE s.available < 10 AND sales.sold_30d > 0
ORDER BY s.available ASC;

-- 39) Backorder candidates
SELECT i.warehouse_id, i.product_id, p.name, i.on_hand, i.reserved
FROM inventory i
JOIN products p ON p.product_id = i.product_id
WHERE i.reserved > i.on_hand;

-- 40) Top category per user by spend
WITH user_category_spend AS (
    SELECT o.user_id, c.category_id, c.name AS category,
           SUM(oi.unit_price * oi.quantity) AS spend
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p ON p.product_id = oi.product_id
    JOIN product_categories pc ON pc.product_id = p.product_id
    JOIN categories c ON c.category_id = pc.category_id
    WHERE o.order_status IN ('PAID', 'SHIPPED', 'REFUNDED')
    GROUP BY o.user_id, c.category_id, c.name
),
ranked AS (
    SELECT *,
           RANK() OVER (PARTITION BY user_id ORDER BY spend DESC) AS rnk
    FROM user_category_spend
)
SELECT user_id, category, spend
FROM ranked
WHERE rnk = 1
ORDER BY user_id, category;
