-- Up Migration
CREATE TABLE IF NOT EXISTS users_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_users_groups_user_id ON users_groups (user_id);
CREATE INDEX IF NOT EXISTS idx_users_groups_group_id ON users_groups (group_id);
CREATE INDEX IF NOT EXISTS idx_users_groups_is_owner ON users_groups (group_id, is_owner) WHERE is_owner = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_group_owner ON users_groups (group_id) WHERE is_owner = TRUE;

-- Down Migration
DROP INDEX IF EXISTS uniq_group_owner;
DROP INDEX IF EXISTS idx_users_groups_is_owner;
DROP INDEX IF EXISTS idx_users_groups_group_id;
DROP INDEX IF EXISTS idx_users_groups_user_id;
DROP TABLE IF EXISTS users_groups;
