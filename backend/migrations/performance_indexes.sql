-- Performance Optimization Database Indexes
-- Task T114: Optimize database queries with proper indexing

-- User-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Pet-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_created_at ON pets(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_user_species ON pets(user_id, species);

-- Pet personalities indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_personalities_pet_id ON pet_personalities(pet_id);

-- Co-owner relationships indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_owner_relationships_pet_id ON co_owner_relationships(pet_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_owner_relationships_user_id ON co_owner_relationships(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_owner_relationships_status ON co_owner_relationships(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_owner_relationships_pet_user ON co_owner_relationships(pet_id, user_id);

-- Notebook-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_notebooks_pet_id ON pet_notebooks(pet_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_notebooks_type ON pet_notebooks(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_notebooks_created_at ON pet_notebooks(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_notebooks_pet_type ON pet_notebooks(pet_id, type);

-- Notebook entries indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_notebook_id ON notebook_entries(notebook_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_type ON notebook_entries(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_date ON notebook_entries(date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_created_at ON notebook_entries(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_notebook_type ON notebook_entries(notebook_id, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_notebook_date ON notebook_entries(notebook_id, date DESC);

-- Specific entry type indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_entries_notebook_id ON medical_entries(notebook_entry_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diet_entries_notebook_id ON diet_entries(notebook_entry_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habit_entries_notebook_id ON habit_entries(notebook_entry_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_command_entries_notebook_id ON command_entries(notebook_entry_id);

-- Sharing-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_notebook_id ON notebook_shares(notebook_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_user_id ON notebook_shares(shared_with_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_status ON notebook_shares(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_created_at ON notebook_shares(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_notebook_user ON notebook_shares(notebook_id, shared_with_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_user_status ON notebook_shares(shared_with_user_id, status);

-- Group-related indexes (if implemented)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_owner_id ON groups(owner_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_memberships');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_memberships');

-- Points system indexes (if implemented)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behaviors_species ON behaviors(species) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'behaviors');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_score_events_pet_id ON score_events(pet_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'score_events');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_score_events_created_at ON score_events(created_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'score_events');

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_user_created ON pets(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_notebook_created ON notebook_entries(notebook_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_type_date ON notebook_entries(type, date DESC);

-- Full-text search indexes (for search functionality)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_name_trgm ON pets USING gin(name gin_trgm_ops) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_title_trgm ON notebook_entries USING gin(title gin_trgm_ops) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_entries_content_trgm ON notebook_entries USING gin(content gin_trgm_ops) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm');

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_owner_relationships_active ON co_owner_relationships(pet_id, user_id) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notebook_shares_active ON notebook_shares(notebook_id, shared_with_user_id) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_with_photos ON pets(id) WHERE photo_url IS NOT NULL;

-- Query optimization recommendations:
--
-- 1. Use LIMIT with ORDER BY for pagination
-- 2. Use EXISTS instead of IN for subqueries when checking existence
-- 3. Use covering indexes for frequently accessed columns
-- 4. Consider partitioning large tables by date if data volume grows significantly
-- 5. Use prepared statements to avoid query plan recalculation
-- 6. Monitor slow query log and use EXPLAIN ANALYZE for optimization
--
-- Example optimized queries:
--
-- Get user's pets with recent entries:
-- SELECT p.*,
--        (SELECT COUNT(*) FROM notebook_entries ne
--         JOIN pet_notebooks pn ON ne.notebook_id = pn.id
--         WHERE pn.pet_id = p.id AND ne.created_at > NOW() - INTERVAL '30 days') as recent_entries
-- FROM pets p
-- WHERE p.user_id = $1
-- ORDER BY p.created_at DESC;
--
-- Get shared notebooks for user:
-- SELECT pn.*, p.name as pet_name, u.first_name || ' ' || u.last_name as owner_name
-- FROM pet_notebooks pn
-- JOIN pets p ON pn.pet_id = p.id
-- JOIN users u ON p.user_id = u.id
-- JOIN notebook_shares ns ON pn.id = ns.notebook_id
-- WHERE ns.shared_with_user_id = $1 AND ns.status = 'active'
-- ORDER BY pn.updated_at DESC;