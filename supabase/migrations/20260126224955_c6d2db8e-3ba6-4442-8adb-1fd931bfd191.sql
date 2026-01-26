-- Remove cache-related tables that are no longer needed
-- The application now uses React Query for in-memory caching instead

DROP TABLE IF EXISTS cache_metrics CASCADE;
DROP TABLE IF EXISTS cache_segments CASCADE;
DROP TABLE IF EXISTS monthly_cache CASCADE;
DROP TABLE IF EXISTS cached_transactions CASCADE;