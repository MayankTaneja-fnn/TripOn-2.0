-- TripOn 2.0 PostgreSQL Schema

-- 1. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    province VARCHAR(255),
    country VARCHAR(100),
    UNIQUE(city, province, country)
);

-- 2. Hotels Table
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    address TEXT,
    price_level VARCHAR(10), -- e.g., $, $$, $$$
    rating_avg DECIMAL(3, 2), -- Aggregated from reviews
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    trust_score DECIMAL(3, 2) DEFAULT 0.0,
    cleanliness_score DECIMAL(3, 2) DEFAULT 0.0,
    service_score DECIMAL(3, 2) DEFAULT 0.0,
    wifi_score DECIMAL(3, 2) DEFAULT 0.0,
    food_score DECIMAL(3, 2) DEFAULT 0.0,
    location_score DECIMAL(3, 2) DEFAULT 0.0,
    noise_score DECIMAL(3, 2) DEFAULT 0.0,
    safety_score DECIMAL(3, 2) DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id),
    review_text TEXT NOT NULL,
    rating DECIMAL(3, 1),
    review_date TIMESTAMP,
    source VARCHAR(100), -- e.g., 'TripAdvisor', 'Booking.com'
    sentiment_json JSONB, -- Stores the aspect-based scores for this specific review
    is_processed BOOLEAN DEFAULT FALSE
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(location_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);
