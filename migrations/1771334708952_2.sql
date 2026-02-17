-- Up Migration
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(1000),
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uid_groups_id ON groups (id);

CREATE OR REPLACE FUNCTION set_deleted_at_groups()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted = TRUE AND OLD.deleted = FALSE THEN
    NEW.deleted_at = NOW();
  ELSIF NEW.deleted = FALSE THEN
    NEW.deleted_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_deleted_at_groups
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION set_deleted_at_groups();

-- Down Migration
DROP TABLE IF EXISTS groups;
