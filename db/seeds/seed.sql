INSERT INTO users (id, email, full_name, password_hash)
VALUES (gen_random_uuid(), 'owner@example.com', 'Workspace Owner', 'local-only-placeholder')
ON CONFLICT (email) DO NOTHING;

WITH owner_user AS (
  SELECT id FROM users WHERE email = 'owner@example.com'
)
INSERT INTO workspaces (id, name, slug, created_by)
SELECT gen_random_uuid(), 'Default Workspace', 'default-workspace', id
FROM owner_user
ON CONFLICT (slug) DO NOTHING;

WITH workspace_row AS (
  SELECT id FROM workspaces WHERE slug = 'default-workspace'
), owner_user AS (
  SELECT id FROM users WHERE email = 'owner@example.com'
)
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT workspace_row.id, owner_user.id, 'owner'
FROM workspace_row, owner_user
ON CONFLICT (workspace_id, user_id) DO NOTHING;
