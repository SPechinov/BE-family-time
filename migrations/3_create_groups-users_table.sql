-- Up Migration
CREATE TABLE IF NOT EXISTS groups_users (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_groups_users_group_id ON groups_users (group_id);
CREATE INDEX IF NOT EXISTS idx_groups_users_user_id ON groups_users (user_id);
CREATE INDEX IF NOT EXISTS idx_groups_users_is_owner ON groups_users (group_id, is_owner) WHERE is_owner = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_group_owner ON groups_users (group_id) WHERE is_owner = TRUE;

-- Down Migration
DROP INDEX IF EXISTS uniq_group_owner;
DROP INDEX IF EXISTS idx_groups_users_is_owner;
DROP INDEX IF EXISTS idx_groups_users_user_id;
DROP INDEX IF EXISTS idx_groups_users_group_id;
DROP TABLE IF EXISTS groups_users;
