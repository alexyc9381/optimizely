-- Optimizely AI Database Initialization Script
-- This script sets up the database for development/staging/production

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for PostgreSQL crypto functions if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create extension for full-text search if not exists
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone for consistency
SET timezone = 'UTC';

-- Create a function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant necessary permissions for the application user
GRANT USAGE ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Optimizely AI database initialization completed successfully';
END $$;
