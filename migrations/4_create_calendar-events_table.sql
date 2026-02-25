-- Up Migration

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(1000),
  event_type VARCHAR(20) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  is_exception BOOLEAN DEFAULT false,
  exception_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT check_event_type CHECK (
    event_type IN ('one-time', 'yearly', 'weekly', 'monthly', 'work-schedule')
  ),
  CONSTRAINT check_recurrence_pattern CHECK (
    (event_type IN ('one-time', 'yearly') AND recurrence_pattern IS NULL) OR
    (event_type IN ('weekly', 'monthly', 'work-schedule') AND recurrence_pattern IS NOT NULL)
  ),
  CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Индексы
CREATE INDEX idx_calendar_events_group_id ON calendar_events (group_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events (start_date, end_date);
CREATE INDEX idx_calendar_events_type ON calendar_events (event_type);
CREATE INDEX idx_calendar_events_parent ON calendar_events (parent_event_id);
CREATE INDEX idx_calendar_events_exception_date ON calendar_events (exception_date)
  WHERE is_exception = true;

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Down Migration
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS calendar_events;
