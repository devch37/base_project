-- SQL Tutor Problems (Basic -> Advanced)

-- 1) Basic: active users with signup date
-- Return active users with their signup date, newest first.
SELECT u.* FROM study.users u WHERE o.status = 'ACTIVE' ORDER BY created_at;

-- 2) Basic join: orders with payment status and amount
-- Show orders with payment status/amount if present.
    SELECT    o.order_id
            , o.order_status
            , p.status
	        , p.amount  
	  FROM study.orders o
INNER JOIN study.payments p
        ON o.order_id = p.order_id;

-- 3) Basic aggregation: total revenue by day
-- Daily revenue for paid/shipped/refunded orders.
   SELECT    o.order_status
           , SUM(o.order_total)
           , DATE(o.placed_at)
      FROM study.orders o
  GROUP BY o.order_status, DATE(o.placed_at);

-- 4) Join + group: revenue by product
-- Total revenue per product for paid/shipped/refunded orders.




-- 5) Multi-join: category revenue contribution
-- Revenue per category for paid/shipped/refunded orders.

-- 6) HAVING: customers with 2+ paid orders
-- Users with at least 2 paid/shipped/refunded orders.

-- 7) Window: rank products by revenue within category
-- Rank products by revenue within each category.

-- 8) Window: cumulative revenue by day
-- Cumulative revenue over time for paid/shipped/refunded orders.

-- 9) Moving average (7-day)
-- 7-day moving average of daily revenue.

-- 10) Percentiles: order total distribution
-- Compute p50/p90/p99 of order_total.

-- 11) RFM segmentation
-- Compute recency, frequency, monetary scores and total RFM score.

-- 12) Cohort retention (by first order month)
-- Cohort users by first order month and show activity by month offset.

-- 13) Funnel conversion (session level)
-- Count sessions at each funnel step.

-- 14) Data quality: orders with missing payments or shipments
-- Find paid/shipped/refunded orders missing payments or shipped orders missing shipments.

-- 15) Inventory coverage: days of stock assuming last 30d sales rate
-- Estimate days of stock by product.

-- 16) Customer LTV (simplified)
-- Lifetime value, order count, first and last order per user.

-- 17) Repeat purchase rate by month
-- For each month, compute repeat customer rate.

-- 18) Detect abnormal refunds (refund > 50% of customer total)
-- Users whose refunded total exceeds 50% of paid total.

-- 19) Top 3 products per supplier by revenue
-- Top 3 revenue products per supplier.

-- 20) Basket analysis: frequently co-purchased products
-- Product pairs frequently bought together.

-- 21) Product rating distribution
-- Average rating and review count by product.

-- 22) Coupon effectiveness: revenue with vs without coupon
-- Compare orders and revenue for coupon vs no-coupon.

-- 23) Time-to-ship and time-to-deliver
-- Compute time to ship and deliver per order.

-- 24) Event to order linkage: sessions leading to purchases
-- Sessions that resulted in purchase events.

-- 25) Daily active users (DAU) from web events
-- Daily unique sessions from web events.

-- 26) Recursive CTE: generate last 14 days calendar with zero-filled revenue
-- Calendar table for last 14 days with revenue (zero-filled).

-- 27) Customer purchase cadence (avg days between orders)
-- Average days between orders per user.

-- 28) Detect price anomalies (price vs category average)
-- Products priced above 2x their category average.

-- 29) Orders with inconsistent totals (sum of items != order_total)
-- Orders where item totals don't match order_total.

-- 30) Supplier performance: item revenue + avg delivery time
-- Supplier revenue and average delivery time.

-- 31) Cohort revenue curve
-- For each cohort month, show monthly revenue by months_since_cohort.

-- 32) Churn risk users
-- Users with 2+ orders in days 60-31 but none in last 30 days.

-- 33) Product conversion rate (view -> purchase)
-- For each product, compute view and purchase sessions and conversion rate.

-- 34) Cart abandonment rate
-- Rate of sessions that added to cart but did not purchase.

-- 35) Top 20% customers by revenue and their cumulative share
-- List top 20% customers by revenue with cumulative revenue share.

-- 36) Month-over-month revenue growth
-- Monthly revenue with MoM absolute and percent change.

-- 37) Median time-to-deliver by carrier
-- Median delivery hours per carrier.

-- 38) Stockout risk
-- Products with available stock < 10 and recent sales > 0.

-- 39) Backorder candidates
-- Inventory rows where reserved exceeds on_hand.

-- 40) Top category per user by spend
-- For each user, show their highest-spend category (ties allowed).
