# 📋 ТЕХНИЧЕСКОЕ ЗАДАНИЕ: Календарь для семейных групп

**Проект:** BE-family-time  
**Версия:** 1.0.0  
**Дата:** 2026-02-25  
**Статус:** Утверждено

---

## 1. ОБЩИЕ СВЕДЕНИЯ

### 1.1. Назначение
Разработать backend API для системы календаря в рамках проекта **BE-family-time**. Календарь позволяет участникам семейных групп создавать и управлять событиями: дни рождения, графики работы, разовые и повторяющиеся события.

### 1.2. Контекст проекта
- **Стек:** Fastify 5.x, TypeScript 5.x, PostgreSQL 16.3, Redis 7.4
- **Архитектура:** Clean Architecture (entities → repositories → services → useCases → routes)
- **Порт API:** 8000
- **Аутентификация:** JWT

### 1.3. Глоссарий
| Термин | Определение |
|--------|-------------|
| **Событие** | Запись в календаре с названием, датами и типом |
| **Повторяющееся событие** | Событие с паттерном повторения (еженедельно, ежемесячно и т.д.) |
| **Исключение** | Отмена или модификация конкретного вхождения повторяющегося события |
| **Work-schedule** | График работы (2/2, день/ночь и т.п.) |
| **Ленивая генерация** | Стратегия хранения паттерна вместо материализации всех вхождений |

---

## 2. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 2.1. Сущности

#### 2.1.1. CalendarEvent (Основная сущность)

**Таблица:** `calendar_events`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `group_id` | UUID | FK на `groups.id` (ON DELETE CASCADE) |
| `creator_user_id` | UUID | FK на `users.id` (ON DELETE SET NULL) |
| `title` | VARCHAR(100) | Название события |
| `description` | VARCHAR(1000) | Описание (опционально) |
| `event_type` | VARCHAR(20) | Тип события |
| `start_date` | TIMESTAMP | Начало события (UTC) |
| `end_date` | TIMESTAMP | Конец события (UTC) |
| `is_all_day` | BOOLEAN | Целодневное событие (default: false) |
| `recurrence_pattern` | JSONB | Паттерн повторения (для weekly, monthly, work-schedule) |
| `parent_event_id` | UUID | FK на `calendar_events.id` (для исключений из серии) |
| `is_exception` | BOOLEAN | Является ли исключением из серии (default: false) |
| `exception_date` | DATE | Дата исключения (для разового удаления из серии) |
| `created_at` | TIMESTAMP | Дата создания (default: NOW()) |
| `updated_at` | TIMESTAMP | Дата обновления (default: NOW(), auto-update) |

**Типы событий (`event_type`):**
- `one-time` — разовое событие
- `yearly` — ежегодное событие (дни рождения)
- `weekly` — еженедельное событие (каждый понедельник)
- `monthly` — ежемесячное событие (каждое 15 число)
- `work-schedule` — график работы (2/2, день/ночь)

**Индексы:**
```sql
CREATE INDEX idx_calendar_events_group_id ON calendar_events (group_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events (start_date, end_date);
CREATE INDEX idx_calendar_events_type ON calendar_events (event_type);
CREATE INDEX idx_calendar_events_parent ON calendar_events (parent_event_id);
CREATE INDEX idx_calendar_events_exception_date ON calendar_events (exception_date) 
  WHERE is_exception = true;
```

**CHECK constraints:**
```sql
CONSTRAINT check_event_type CHECK (
  event_type IN ('one-time', 'yearly', 'weekly', 'monthly', 'work-schedule')
),
CONSTRAINT check_recurrence_pattern CHECK (
  (event_type IN ('one-time', 'yearly') AND recurrence_pattern IS NULL) OR
  (event_type IN ('weekly', 'monthly', 'work-schedule') AND recurrence_pattern IS NOT NULL)
),
CONSTRAINT check_dates CHECK (end_date >= start_date)
```

---

#### 2.1.2. Структура recurrence_pattern (JSONB)

**Для weekly:**
```json
{
  "type": "weekly",
  "weekdays": [1, 3, 5]
}
```
- `weekdays`: массив дней недели (1=понедельник, 7=воскресенье)

**Для monthly:**
```json
{
  "type": "monthly",
  "dayOfMonth": 15
}
```
- `dayOfMonth`: число месяца (1-31)

**Для work-schedule:**
```json
{
  "type": "work-schedule",
  "shiftPattern": [1, 1, 0, 0],
  "startDate": "2026-01-01",
  "shiftDuration": 1
}
```
- `shiftPattern`: массив смен (1=работа, 0=отдых), например [1,1,0,0] = 2/2
- `startDate`: дата начала отсчёта паттерна
- `shiftDuration`: длительность одной смены в днях

---

#### 2.1.3. Исключения (Exceptions)

Исключение — это запись, которая отменяет или модифицирует конкретное вхождение повторяющегося события.

**Структура исключения:**
```json
{
  "id": "uuid-exception",
  "parentEventId": "uuid-parent",
  "isException": true,
  "exceptionDate": "2026-06-01",
  "eventType": "work-schedule",
  "title": "Отпуск вместо смены",
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-06-14T23:59:59Z"
}
```

**Логика:**
- При удалении одного вхождения создаётся запись с `is_exception = true`
- При генерации вхождений исключения исключаются из итогового списка

---

### 2.2. Стратегия хранения: Ленивая генерация

| Тип события | Стратегия хранения | Пример |
|-------------|-------------------|--------|
| `one-time` | Одна запись | Встреча 25.02.2026 = 1 запись |
| `yearly` | Одна запись навечно | День рождения = 1 запись |
| `weekly` | Одна запись | Тренировки каждый понедельник = 1 запись |
| `monthly` | Одна запись | Платёж 15 числа = 1 запись |
| `work-schedule` | Одна запись + исключения | График 2/2 на 5 лет = 1 запись + ~20 исключений |

**Преимущества:**
- Экономия места в БД: ~60x меньше записей
- Проще редактировать график
- Нет необходимости в очистке старых записей

**Алгоритм получения событий за период:**
```typescript
1. Получить базовые события из БД (без исключений)
2. Получить исключения за период
3. Сгенерировать вхождения на лету (для recurring событий)
4. Применить исключения
5. Вернуть фронтенду развёрнутые события
```

---

### 2.3. API Endpoints

Все endpoints требуют JWT аутентификации.

**Префикс:** `/groups/:groupId/calendar`

---

#### 2.3.1. Список событий группы

```http
GET /groups/:groupId/calendar/events
```

**Query параметры:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `startDate` | string (ISO 8601) | Да | Начало периода (UTC) |
| `endDate` | string (ISO 8601) | Да | Конец периода (UTC) |
| `eventType` | string | Нет | Фильтрация по типу события |
| `search` | string | Нет | Поиск по title и description |

**Пример:**
```
GET /groups/uuid/calendar/events?startDate=2026-02-01&endDate=2026-02-28&eventType=weekly
```

**Ответ (200 OK):**
```json
[
  {
    "id": "uuid",
    "groupId": "uuid",
    "creatorUserId": "uuid",
    "title": "День рождения",
    "description": "optional",
    "eventType": "yearly",
    "startDate": "2026-02-25T00:00:00Z",
    "endDate": "2026-02-25T23:59:59Z",
    "isAllDay": true,
    "recurrencePattern": null,
    "parentEventId": null,
    "isException": false,
    "exceptionDate": null,
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

**Логика:**
1. Проверить, что пользователь — участник группы
2. Получить все события группы
3. Отфильтровать по датам (для one-time) или сгенерировать вхождения (для recurring)
4. Применить исключения
5. Вернуть развёрнутые события

---

#### 2.3.2. Создание события

```http
POST /groups/:groupId/calendar/events
```

**Тело запроса:**
```json
{
  "title": "Смена",
  "description": "optional",
  "eventType": "weekly",
  "startDate": "2026-02-25T09:00:00Z",
  "endDate": "2026-02-25T18:00:00Z",
  "isAllDay": false,
  "recurrencePattern": {
    "type": "weekly",
    "weekdays": [1, 3, 5]
  }
}
```

**Валидация:**
| Поле | Правило |
|------|---------|
| `title` | 1-100 символов, обязательно |
| `description` | 0-1000 символов, опционально |
| `eventType` | Один из допустимых типов |
| `endDate` | >= `startDate` |
| `recurrencePattern` | Обязательно для weekly/monthly/work-schedule |

**Специфичная валидация recurrencePattern:**
- `weekly`: `weekdays` — массив чисел 1-7, не пустой
- `monthly`: `dayOfMonth` — число 1-31
- `work-schedule`: `shiftPattern` — массив 0/1, длина >= 2

**Ответ (201 Created):** Тело созданного события

---

#### 2.3.3. Получение одного события

```http
GET /groups/:groupId/calendar/events/:eventId
```

**Ответ (200 OK):** Объект события

**Ошибки:**
- `404 Not Found` — событие не найдено
- `403 Forbidden` — пользователь не участник группы

---

#### 2.3.4. Обновление события

```http
PATCH /groups/:groupId/calendar/events/:eventId
```

**Тело запроса (любые поля опционально):**
```json
{
  "title": "Новое название",
  "description": "updated",
  "startDate": "2026-03-01T10:00:00Z",
  "endDate": "2026-03-01T19:00:00Z"
}
```

**Ограничения:**
- Нельзя изменить `eventType` после создания
- Нельзя изменить `recurrencePattern` для recurring событий (только через пересоздание)

**Ответ (200 OK):** Обновлённое событие

---

#### 2.3.5. Удаление события

```http
DELETE /groups/:groupId/calendar/events/:eventId
```

**Query параметр:**
| Параметр | Тип | Значение | Описание |
|----------|-----|----------|----------|
| `deleteMode` | string | `single` (default) \| `all` | Для повторяющихся событий |

**Логика:**
- `single` — создать исключение (`is_exception = true`, `exception_date = дата`)
- `all` — удалить всю серию (все события с `parent_event_id` или само событие-родитель)

**Ответ (200 OK):** Пустое тело

---

#### 2.3.6. Массовое создание событий графика работы

```http
POST /groups/:groupId/calendar/events/work-schedule/bulk
```

**Тело запроса:**
```json
{
  "title": "График 2/2",
  "description": "optional",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "shiftPattern": [1, 1, 0, 0],
  "shiftDuration": 1
}
```

**Логика:**
1. Создать одно событие-родитель с `event_type = 'work-schedule'`
2. Сохранить паттерн в `recurrence_pattern`
3. **Не генерировать вхождения** (ленивая стратегия)

**Ответ (201 Created):**
```json
{
  "id": "uuid-parent",
  "title": "График 2/2",
  "eventType": "work-schedule",
  "recurrencePattern": {
    "type": "work-schedule",
    "shiftPattern": [1, 1, 0, 0],
    "startDate": "2026-01-01",
    "shiftDuration": 1
  }
}
```

---

### 2.4. Бизнес-логика

#### 2.4.1. Разрешения

| Действие | Разрешение |
|----------|------------|
| Просмотр событий | Все участники группы |
| Создание события | Все участники группы |
| Редактирование | Все участники группы |
| Удаление | Все участники группы |

**Проверка:**
- Пользователь должен быть в таблице `groups_users` с `group_id` события
- Отдельных ограничений для создателя нет

---

#### 2.4.2. Генерация вхождений (Occurrence Generation)

**Алгоритм для weekly:**
```typescript
function generateWeekly(event, periodStart, periodEnd) {
  const occurrences = [];
  const weekdays = event.recurrencePattern.weekdays; // [1, 3, 5]
  
  let current = startOfWeek(periodStart);
  while (current <= periodEnd) {
    const dayOfWeek = getDayOfWeek(current); // 1-7
    if (weekdays.includes(dayOfWeek)) {
      occurrences.push({
        ...event,
        startDate: setTime(current, event.startDate),
        endDate: setTime(current, event.endDate)
      });
    }
    current = addDays(current, 1);
  }
  
  return occurrences;
}
```

**Алгоритм для monthly:**
```typescript
function generateMonthly(event, periodStart, periodEnd) {
  const occurrences = [];
  const dayOfMonth = event.recurrencePattern.dayOfMonth; // 15
  
  let current = startOfMonth(periodStart);
  while (current <= periodEnd) {
    const daysInMonth = getDaysInMonth(current);
    if (dayOfMonth <= daysInMonth) {
      const occurrenceDate = setDate(current, dayOfMonth);
      if (occurrenceDate >= periodStart && occurrenceDate <= periodEnd) {
        occurrences.push({
          ...event,
          startDate: setTime(occurrenceDate, event.startDate),
          endDate: setTime(occurrenceDate, event.endDate)
        });
      }
    }
    current = addMonths(current, 1);
  }
  
  return occurrences;
}
```

**Алгоритм для work-schedule:**
```typescript
function generateWorkShifts(event, periodStart, periodEnd) {
  const occurrences = [];
  const { shiftPattern, startDate: patternStart, shiftDuration } = event.recurrencePattern;
  const patternLength = shiftPattern.length; // 4 для [1,1,0,0]
  
  let current = parseDate(patternStart);
  let patternIndex = 0;
  
  // Находим первую смену в периоде
  while (current < periodStart) {
    patternIndex = (patternIndex + 1) % patternLength;
    current = addDays(current, shiftDuration);
  }
  
  // Генерируем смены в периоде
  while (current <= periodEnd) {
    if (shiftPattern[patternIndex] === 1) {
      occurrences.push({
        ...event,
        startDate: startOfDay(current),
        endDate: endOfDay(current)
      });
    }
    patternIndex = (patternIndex + 1) % patternLength;
    current = addDays(current, shiftDuration);
  }
  
  return occurrences;
}
```

**Алгоритм для yearly:**
```typescript
function generateYearly(event, periodStart, periodEnd) {
  const occurrences = [];
  const eventMonth = getMonth(event.startDate); // 1-12
  const eventDay = getDate(event.startDate); // 1-31
  
  let currentYear = getYear(periodStart);
  while (currentYear <= getYear(periodEnd)) {
    const daysInMonth = getDaysInMonth(new Date(currentYear, eventMonth - 1));
    if (eventDay <= daysInMonth) {
      const occurrenceDate = new Date(currentYear, eventMonth - 1, eventDay);
      if (occurrenceDate >= periodStart && occurrenceDate <= periodEnd) {
        occurrences.push({
          ...event,
          startDate: startOfDay(occurrenceDate),
          endDate: endOfDay(occurrenceDate)
        });
      }
    }
    currentYear++;
  }
  
  return occurrences;
}
```

---

#### 2.4.3. Применение исключений

```typescript
function applyExceptions(occurrences, exceptions) {
  const exceptionDates = new Set(
    exceptions.map(e => formatDate(e.exceptionDate))
  );
  
  return occurrences.filter(occ => 
    !exceptionDates.has(formatDate(occ.startDate))
  );
}
```

---

#### 2.4.4. Часовые пояса

- **Хранение:** Все даты в UTC
- **API:** Отдаёт даты в UTC
- **Фронтенд:** Конвертирует в локальный часовой пояс (MSK = UTC+3)

**Пример:**
```typescript
// БД: 2026-02-25T09:00:00Z (UTC)
// API: 2026-02-25T09:00:00Z
// Фронтенд: 2026-02-25T12:00:00+03:00 (MSK)
```

---

#### 2.4.5. Поиск и фильтрация

**Поиск (query параметр `search`):**
- Поля: `title`, `description`
- Регистронезависимый: `ILIKE`
- Частичное совпадение: `%search%`

**SQL:**
```sql
WHERE title ILIKE $1 OR description ILIKE $1
-- $1 = '%search%'
```

**Фильтрация:**
- По `event_type`: точное совпадение
- По диапазону дат: для one-time — SQL фильтрация, для recurring — генерация + фильтрация

---

## 3. ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ

### 3.1. Структура файлов

```
src/
├── entities/
│   └── calendarEvent.ts          # Сущности (CalendarEventEntity, CalendarEventCreateEntity, ...)
│
├── repositories/
│   └── db/
│       └── calendarEvents/
│           ├── index.ts          # Экспорт
│           ├── calendarEvents.ts # Реализация репозитория
│           └── types.ts          # Типы для строк БД (ICalendarEventRow)
│
├── domains/
│   ├── repositories/
│   │   └── db/
│   │       └── calendarEvents.ts # Интерфейс ICalendarEventsRepository
│   │
│   └── services/
│       └── calendarEvents.ts     # Интерфейс ICalendarEventsService
│
├── services/
│   └── calendarEvents.ts         # Реализация сервиса (бизнес-логика)
│
├── useCases/
│   └── calendarEvents/
│       ├── index.ts              # Экспорт
│       └── calendarEvents.ts     # Реализация ICalendarEventsUseCases
│
└── api/rest/
    └── routes/
        └── groups/
            ├── calendar/
            │   ├── controller.ts # Контроллер (маршруты)
            │   ├── schemas.ts    # Zod схемы
            │   ├── constants.ts  # PREFIX, ROUTES
            │   └── index.ts      # Экспорт
            └── controller.ts     # Обновить (добавить под-роуты календаря)
```

---

### 3.2. Миграция БД

**Файл:** `migrations/4_create_calendar-events_table.sql`

```sql
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
```

---

### 3.3. Entity (calendarEvent.ts)

```typescript
import { UUID } from 'node:crypto';

export type CalendarEventType = 'one-time' | 'yearly' | 'weekly' | 'monthly' | 'work-schedule';

export type RecurrencePattern = 
  | { type: 'weekly'; weekdays: number[] }
  | { type: 'monthly'; dayOfMonth: number }
  | { type: 'work-schedule'; shiftPattern: number[]; startDate: string; shiftDuration: number };

export class CalendarEventEntity {
  readonly #id: UUID;
  readonly #groupId: UUID;
  readonly #creatorUserId: UUID;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #startDate: Date;
  readonly #endDate: Date;
  readonly #isAllDay: boolean;
  readonly #recurrencePattern?: RecurrencePattern;
  readonly #parentEventId?: UUID;
  readonly #isException: boolean;
  readonly #exceptionDate?: Date;
  readonly #createdAt: Date;

  constructor(props: {
    id: UUID;
    groupId: UUID;
    creatorUserId: UUID;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    recurrencePattern?: RecurrencePattern;
    parentEventId?: UUID;
    isException: boolean;
    exceptionDate?: Date;
    createdAt: Date;
  }) {
    this.#id = props.id;
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#isAllDay = props.isAllDay;
    this.#recurrencePattern = props.recurrencePattern;
    this.#parentEventId = props.parentEventId;
    this.#isException = props.isException;
    this.#exceptionDate = props.exceptionDate;
    this.#createdAt = props.createdAt;
  }

  get id() { return this.#id; }
  get groupId() { return this.#groupId; }
  get creatorUserId() { return this.#creatorUserId; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get eventType() { return this.#eventType; }
  get startDate() { return this.#startDate; }
  get endDate() { return this.#endDate; }
  get isAllDay() { return this.#isAllDay; }
  get recurrencePattern() { return this.#recurrencePattern; }
  get parentEventId() { return this.#parentEventId; }
  get isException() { return this.#isException; }
  get exceptionDate() { return this.#exceptionDate; }
  get createdAt() { return this.#createdAt; }
}

export class CalendarEventCreateEntity {
  readonly #groupId: UUID;
  readonly #creatorUserId: UUID;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #startDate: Date;
  readonly #endDate: Date;
  readonly #isAllDay: boolean;
  readonly #recurrencePattern?: RecurrencePattern;

  constructor(props: {
    groupId: UUID;
    creatorUserId: UUID;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    recurrencePattern?: RecurrencePattern;
  }) {
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#isAllDay = props.isAllDay;
    this.#recurrencePattern = props.recurrencePattern;
  }

  get groupId() { return this.#groupId; }
  get creatorUserId() { return this.#creatorUserId; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get eventType() { return this.#eventType; }
  get startDate() { return this.#startDate; }
  get endDate() { return this.#endDate; }
  get isAllDay() { return this.#isAllDay; }
  get recurrencePattern() { return this.#recurrencePattern; }
}

// Аналогично: CalendarEventFindOneEntity, CalendarEventFindManyEntity, CalendarEventPatchEntity
```

---

### 3.4. Интерфейсы

#### ICalendarEventsRepository
```typescript
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { CalendarEventEntity, CalendarEventCreateEntity } from '@/entities';
import { UUID } from 'node:crypto';

export interface ICalendarEventsRepository {
  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  findOne(
    id: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null>;

  findByGroupId(
    groupId: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  findExceptions(
    groupId: UUID,
    exceptionStartDate: Date,
    exceptionEndDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  patchOne(
    id: UUID,
    patchData: Partial<CalendarEventCreateEntity>,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  deleteOne(
    id: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;

  deleteSeries(
    parentEventId: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
```

#### ICalendarEventsService
```typescript
import { CalendarEventEntity, CalendarEventCreateEntity } from '@/entities';
import { UUID } from 'node:crypto';

export interface ICalendarEventsService {
  createEvent(entity: CalendarEventCreateEntity): Promise<CalendarEventEntity>;
  getEventsByGroupId(groupId: UUID, periodStart: Date, periodEnd: Date): Promise<CalendarEventEntity[]>;
  getEventById(id: UUID): Promise<CalendarEventEntity>;
  updateEvent(id: UUID, patchData: Partial<CalendarEventCreateEntity>): Promise<CalendarEventEntity>;
  deleteEvent(id: UUID, deleteMode: 'single' | 'all'): Promise<void>;
}
```

---

### 3.5. Схемы валидации (schemas.ts)

```typescript
import { z } from 'zod';
import { createResponseSchema } from '@/api/rest/utils';

const CALENDAR_EVENT_SCHEMA = z.object({
  id: z.uuidv4(),
  groupId: z.uuidv4(),
  creatorUserId: z.uuidv4(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  eventType: z.enum(['one-time', 'yearly', 'weekly', 'monthly', 'work-schedule']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isAllDay: z.boolean(),
  recurrencePattern: z.object({
    type: z.enum(['weekly', 'monthly', 'work-schedule']),
    weekdays: z.array(z.number().min(1).max(7)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    shiftPattern: z.array(z.number().min(0).max(1)).optional(),
    startDate: z.string().date().optional(),
    shiftDuration: z.number().positive().optional(),
  }).optional(),
  parentEventId: z.uuidv4().optional(),
  isException: z.boolean(),
  exceptionDate: z.string().date().optional(),
  createdAt: z.string().datetime(),
});

const CREATE_EVENT_BODY = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  eventType: z.enum(['one-time', 'yearly', 'weekly', 'monthly', 'work-schedule']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isAllDay: z.boolean().optional().default(false),
  recurrencePattern: z.object({
    type: z.enum(['weekly', 'monthly', 'work-schedule']),
    weekdays: z.array(z.number().min(1).max(7)).min(1).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    shiftPattern: z.array(z.number().min(0).max(1)).min(2).optional(),
    startDate: z.string().date().optional(),
    shiftDuration: z.number().positive().optional(),
  }).refine((data) => {
    if (data.type === 'weekly') return !!data.weekdays;
    if (data.type === 'monthly') return !!data.dayOfMonth;
    if (data.type === 'work-schedule') return !!data.shiftPattern && !!data.startDate;
    return false;
  }, { message: 'Invalid recurrencePattern for eventType' }).optional(),
}).refine((data) => {
  if (data.recurrencePattern && data.recurrencePattern.type !== data.eventType) {
    return data.eventType !== 'one-time' && data.eventType !== 'yearly';
  }
  return true;
}, { message: 'recurrencePattern type must match eventType' });

const PATCH_EVENT_BODY = CREATE_EVENT_BODY.partial();

const GET_LIST = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.uuidv4(),
  }),
  querystring: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    eventType: z.enum(['one-time', 'yearly', 'weekly', 'monthly', 'work-schedule']).optional(),
    search: z.string().max(100).optional(),
  }),
  response: createResponseSchema({
    200: z.array(CALENDAR_EVENT_SCHEMA),
  }),
};

const CREATE = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.uuidv4(),
  }),
  body: CREATE_EVENT_BODY,
  response: createResponseSchema({
    201: CALENDAR_EVENT_SCHEMA,
  }),
};

// ... остальные схемы (GET, PATCH, DELETE)

export const SCHEMAS = Object.freeze({
  getList: GET_LIST,
  create: CREATE,
  // ...
});
```

---

## 4. ТРЕБОВАНИЯ К КАЧЕСТВУ

### 4.1. Тестирование

**Unit-тесты:**
- Сервисы: генерация вхождений (weekly, monthly, work-schedule)
- Use cases: бизнес-логика, проверки разрешений
- Репозитории: маппинг БД → Entity

**Integration-тесты:**
- API endpoints (с testcontainers: PostgreSQL + Redis)
- Сценарии: создание, получение, обновление, удаление
- Исключения: удаление одного вхождения из серии

**Покрытие:** ≥80% для новой логики

---

### 4.2. Логирование

**Инструмент:** Pino

**Что логировать:**
```typescript
logger.debug({ groupId, eventType, title }, 'Calendar event created');
logger.debug({ eventId, deleteMode }, 'Calendar event deleted');
logger.error({ error }, 'Failed to generate occurrences');
```

**Уровни:**
- `debug` — успешные операции
- `info` — важные события (создание пользователя, группы)
- `error` — ошибки
- `warn` — предупреждения (невалидные данные)

---

### 4.3. Расширяемость

**Принципы:**
- Использовать интерфейсы для сервисов и репозиториев
- Избегать жёсткой связанности
- Документировать типы событий в отдельном файле
- Следовать конвенциям проекта (именование, структура)

**Точки расширения:**
- Новые типы событий (добавить в `CalendarEventType`)
- Новые паттерны повторения (добавить в `RecurrencePattern`)
- Цветовые метки (добавить поле `color` в Entity)
- Напоминания (отдельная таблица `event_reminders`)

---

## 5. ЭТАПЫ РЕАЛИЗАЦИИ

| № | Этап | Описание | Статус |
|---|-------|----------|--------|
| 1 | Миграция БД | Создать `migrations/4_create_calendar-events_table.sql` | ⬜ |
| 2 | Entities | `src/entities/calendarEvent.ts` | ⬜ |
| 3 | Repository (DB) | `src/repositories/db/calendarEvents/` | ⬜ |
| 4 | Repository Interface | `src/domains/repositories/db/calendarEvents.ts` | ⬜ |
| 5 | Service Interface | `src/domains/services/calendarEvents.ts` | ⬜ |
| 6 | Service Implementation | `src/services/calendarEvents.ts` | ⬜ |
| 7 | Use Cases | `src/useCases/calendarEvents/` | ⬜ |
| 8 | API Routes | `src/api/rest/routes/groups/calendar/` | ⬜ |
| 9 | Integration Tests | Тесты API endpoints | ⬜ |
| 10 | Unit Tests | Тесты сервисов, use cases | ⬜ |
| 11 | Обновление контроллера групп | Подключить календарь как под-роуты | ⬜ |
| 12 | Документация API | Swagger (через @fastify/swagger-ui) | ⬜ |

---

## 6. ПРИМЕРЫ BRU ФАЙЛОВ (для Bruno)

**Файл:** `api/calendar/events-list.bru`
```bru
meta {
  name: events-list
  type: http
  seq: 1
}

get {
  url: {{url}}/groups/:groupId/calendar/events?startDate=2026-02-01&endDate=2026-02-28
  body: formUrlEncoded
  auth: bearer
}

params:path {
  groupId: <uuid>
}

auth:bearer {
  token: {{authToken}}
}

settings {
  encodeUrl: true
  timeout: 0
}
```

**Файл:** `api/calendar/create-event.bru`
```bru
meta {
  name: create-event
  type: http
  seq: 2
}

post {
  url: {{url}}/groups/:groupId/calendar/events
  body: json
  auth: bearer
}

params:path {
  groupId: <uuid>
}

body {
  {
    "title": "Смена",
    "eventType": "weekly",
    "startDate": "2026-02-25T09:00:00Z",
    "endDate": "2026-02-25T18:00:00Z",
    "isAllDay": false,
    "recurrencePattern": {
      "type": "weekly",
      "weekdays": [1, 3, 5]
    }
  }
}

auth:bearer {
  token: {{authToken}}
}

settings {
  encodeUrl: true
  timeout: 0
}
```

---

## 7. ВОПРОСЫ ДЛЯ БУДУЩЕГО РАСШИРЕНИЯ

- [ ] **Цветовые метки:** Поле `color` (VARCHAR(7), hex #RRGGBB)
- [ ] **Напоминания:** Таблица `event_reminders` (user_id, event_id, remind_at, method)
- [ ] **Интеграция с Google Calendar:** Экспорт/импорт через iCal (.ics)
- [ ] **Индивидуальные часовые пояса:** Поле `timezone` у пользователя (default: UTC)
- [ ] **Разрешения на уровне событий:** Поле `access_level` (owner, write, read)
- [ ] **Приглашения на события:** Таблица `event_invites` (event_id, user_id, status)
- [ ] **Вложения:** Таблица `event_attachments` (event_id, file_url, file_type)

---

## 8. ПРИЛОЖЕНИЯ

### 8.1. Примеры запросов/ответов

**Создание еженедельного события:**
```json
// POST /groups/uuid/calendar/events
{
  "title": "Тренировка",
  "description": "Спортзал",
  "eventType": "weekly",
  "startDate": "2026-02-25T19:00:00Z",
  "endDate": "2026-02-25T21:00:00Z",
  "isAllDay": false,
  "recurrencePattern": {
    "type": "weekly",
    "weekdays": [1, 3, 5]
  }
}
```

**Ответ:**
```json
{
  "id": "uuid-event",
  "groupId": "uuid-group",
  "creatorUserId": "uuid-user",
  "title": "Тренировка",
  "description": "Спортзал",
  "eventType": "weekly",
  "startDate": "2026-02-25T19:00:00Z",
  "endDate": "2026-02-25T21:00:00Z",
  "isAllDay": false,
  "recurrencePattern": {
    "type": "weekly",
    "weekdays": [1, 3, 5]
  },
  "parentEventId": null,
  "isException": false,
  "exceptionDate": null,
  "createdAt": "2026-02-25T10:00:00Z"
}
```

**Получение событий за период:**
```json
// GET /groups/uuid/calendar/events?startDate=2026-03-01&endDate=2026-03-31

// Ответ (развёрнутые вхождения):
[
  {
    "id": "uuid-event",
    "title": "Тренировка",
    "startDate": "2026-03-02T19:00:00Z", // Понедельник
    "endDate": "2026-03-02T21:00:00Z"
  },
  {
    "id": "uuid-event",
    "title": "Тренировка",
    "startDate": "2026-03-04T19:00:00Z", // Среда
    "endDate": "2026-03-04T21:00:00Z"
  },
  {
    "id": "uuid-event",
    "title": "Тренировка",
    "startDate": "2026-03-06T19:00:00Z", // Пятница
    "endDate": "2026-03-06T21:00:00Z"
  }
  // ... остальные понедельники, среды, пятницы марта
]
```

---

### 8.2. Диаграмма сущностей

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│     groups      │       │   calendar_events    │       │      users      │
├─────────────────┤       ├──────────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ group_id (FK)        │       │ id (PK)         │
│ name            │       │ creator_user_id (FK) │──────►│ email           │
│ description     │       │ title                │       │ phone           │
│ created_at      │       │ description          │       │ firstName       │
└─────────────────┘       │ event_type           │       │ lastName        │
                          │ start_date           │       │ created_at      │
                          │ end_date             │       └─────────────────┘
                          │ is_all_day           │
                          │ recurrence_pattern   │
                          │ parent_event_id (FK) │──────┐
                          │ is_exception         │      │ (self-reference)
                          │ exception_date       │      │
                          │ created_at           │      │
                          │ updated_at           │      │
                          └──────────────────────┘◄─────┘
```

---

**Документ утверждён.**  
**Следующий шаг:** Реализация согласно этапам из раздела 5.
