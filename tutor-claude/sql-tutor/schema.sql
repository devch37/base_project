-- SQL Tutor Schema (PostgreSQL)

CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
    address_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE suppliers (
    supplier_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL
);

CREATE TABLE categories (
    category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
    product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(supplier_id),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_categories (
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    category_id BIGINT NOT NULL REFERENCES categories(category_id),
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE warehouses (
    warehouse_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL
);

CREATE TABLE inventory (
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id),
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    on_hand INT NOT NULL DEFAULT 0,
    reserved INT NOT NULL DEFAULT 0,
    PRIMARY KEY (warehouse_id, product_id)
);

CREATE TABLE orders (
    order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    order_status TEXT NOT NULL CHECK (order_status IN ('CREATED', 'PAID', 'SHIPPED', 'CANCELLED', 'REFUNDED')),
    order_total NUMERIC(12,2) NOT NULL CHECK (order_total >= 0),
    placed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    order_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE payments (
    payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    method TEXT NOT NULL CHECK (method IN ('CARD', 'BANK', 'WALLET')),
    status TEXT NOT NULL CHECK (status IN ('APPROVED', 'DECLINED', 'REFUNDED')),
    paid_at TIMESTAMP
);

CREATE TABLE shipments (
    shipment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id),
    carrier TEXT NOT NULL,
    tracking_no TEXT,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

CREATE TABLE returns (
    return_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED')),
    requested_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
    coupon_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_pct NUMERIC(5,2) NOT NULL CHECK (discount_pct BETWEEN 0 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE order_coupons (
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    coupon_id BIGINT NOT NULL REFERENCES coupons(coupon_id),
    PRIMARY KEY (order_id, coupon_id)
);

CREATE TABLE reviews (
    review_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE web_sessions (
    session_id TEXT PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE web_events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES web_sessions(session_id),
    event_type TEXT NOT NULL CHECK (event_type IN ('VIEW', 'ADD_TO_CART', 'CHECKOUT', 'PURCHASE')),
    product_id BIGINT REFERENCES products(product_id),
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for real-world query performance
CREATE INDEX idx_orders_user_placed ON orders(user_id, placed_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_events_session ON web_events(session_id, occurred_at);
CREATE INDEX idx_events_type_time ON web_events(event_type, occurred_at);
