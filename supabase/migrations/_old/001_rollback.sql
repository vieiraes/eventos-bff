-- ============================================
-- ROLLBACK Migration 001 - Initial Schema
-- ============================================
-- Execute este script para remover todas as tabelas criadas
-- ATENÇÃO: Isto irá DELETAR TODOS OS DADOS!

-- Drop policies first
DROP POLICY IF EXISTS "Users can view instance events" ON events;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_access_updated_at ON user_access;
DROP TRIGGER IF EXISTS update_registration_items_updated_at ON registration_items;
DROP TRIGGER IF EXISTS update_access_packages_updated_at ON access_packages;
DROP TRIGGER IF EXISTS update_event_areas_updated_at ON event_areas;
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_instances_updated_at ON instances;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (ordem inversa de dependência)
DROP TABLE IF EXISTS user_access CASCADE;
DROP TABLE IF EXISTS registration_items CASCADE;
DROP TABLE IF EXISTS access_packages CASCADE;
DROP TABLE IF EXISTS event_areas CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS instances CASCADE;

-- Optionally drop extension (cuidado se outros schemas usam)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
