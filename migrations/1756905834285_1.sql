-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
                                     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_encrypted BYTEA,
    email_searchable BYTEA,
    phone_encrypted BYTEA,
    phone_searchable BYTEA,
    password BYTEA NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
    );

CREATE UNIQUE INDEX IF NOT EXISTS uid_users_id ON users (id);
CREATE INDEX IF NOT EXISTS uid_users_email_searchable ON users (email_searchable);
CREATE INDEX IF NOT EXISTS uid_users_phone_searchable ON users (phone_searchable);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Down Migration
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS uid_users_phone_searchable;
DROP INDEX IF EXISTS uid_users_email_searchable;
DROP INDEX IF EXISTS uid_users_id;
DROP TABLE IF EXISTS users;
DROP EXTENSION IF EXISTS "uuid-ossp";