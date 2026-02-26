-- Up Migration

CREATE TABLE IF NOT EXISTS group_calendar
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID         NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    creator_user_id UUID         NOT NULL REFERENCES users (id) ON DELETE SET NULL,
    title           VARCHAR(100) NOT NULL,
    description     VARCHAR(1000),
    event_type      VARCHAR(20),
    iteration_type  VARCHAR(20)  NOT NULL,
    start_date      TIMESTAMP    NOT NULL,
    end_date        TIMESTAMP        DEFAULT NULL,
    created_at      TIMESTAMP        DEFAULT NOW(),

    CONSTRAINT check_event_type CHECK (
        event_type IN ('birthday', 'vacation', 'holiday')
        ),

    CONSTRAINT check_iteration_type CHECK (
        iteration_type IN ('oneTime', 'weekly', 'monthly', 'yearly')
        ),

    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Индексы
CREATE INDEX idx_group_calendar_group_id ON group_calendar (group_id);
CREATE INDEX idx_group_calendar_dates ON group_calendar (start_date, end_date);
CREATE INDEX idx_group_calendar_event_type ON group_calendar (event_type);
CREATE INDEX idx_group_calendar_iteration_type ON group_calendar (iteration_type);

-- Down Migration
DROP INDEX IF EXISTS idx_group_calendar_group_id;
DROP INDEX IF EXISTS idx_group_calendar_dates;
DROP INDEX IF EXISTS idx_group_calendar_event_type;
DROP INDEX IF EXISTS idx_group_calendar_iteration_type;
DROP TABLE IF EXISTS group_calendar;
