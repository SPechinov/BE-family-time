# План интеграционных тестов Calendar Events API

## Обзор

Интеграционные тесты для API календарных событий покрывают CRUD операции, валидацию данных, права доступа и бизнес-логику.

**Файл:** `src/tests/integration/calendarEvents.test.ts`

**Endpoint:** `/api/groups/:groupId/calendar-events`

---

## Структура тестов

### 1. Подготовка окружения (Setup)

```typescript
- beforeAll: инициализация test environment (Fastify, PostgreSQL, Redis)
- afterAll: очистка окружения
- afterEach: очистка таблиц calendar_events, groups_users, groups
```

### 2. Фикстуры

Необходимо создать:

```typescript
// Calendar Event fixtures
export interface TestCalendarEventData {
  title: string;
  description?: string;
  eventType?: 'birthday' | 'vacation' | 'holiday';
  iterationType: 'oneTime' | 'weekly' | 'monthly' | 'yearly';
  recurrencePattern?: {
    type: 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  startDate: Date | string;
  endDate?: Date | string;
}

export const createCalendarEventFixture = (
  groupId: string,
  creatorUserId: string,
  overrides?: Partial<TestCalendarEventData>
): TestCalendarEventData => { ... }
```

---

## Тесты по endpoint'ам

### POST /api/groups/:groupId/calendar-events (Создание события)

#### ✅ Позитивные тесты (8 тестов)

| # | Название | Описание | Данные |
|---|----------|----------|--------|
| 1 | **Создание one-time события** | Базовое событие без повторений | `iterationType: oneTime`, без `recurrencePattern` |
| 2 | **Создание yearly события** | Ежегодное событие | `iterationType: yearly`, без `recurrencePattern` |
| 3 | **Создание weekly события** | Еженедельное событие с pattern | `iterationType: weekly`, `recurrencePattern: {type: weekly, dayOfWeek: 1}` |
| 4 | **Создание monthly события** | Ежемесячное событие с pattern | `iterationType: monthly`, `recurrencePattern: {type: monthly, dayOfMonth: 15}` |
| 5 | **Создание с description** | Событие с описанием | `description: "Описание"` |
| 6 | **Создание с eventType** | Событие с типом | `eventType: birthday/vacation/holiday` |
| 7 | **Создание с endDate** | Событие с датой окончания | `startDate`, `endDate` |
| 8 | **Создание без eventType** | Событие без типа (optional) | без `eventType` |

**Проверки:**
- Status code: `201`
- Response содержит все поля: `id, title, description, type, iterationType, startDate, endDate, recurrencePattern, createdAt`
- `id` — валидный UUID
- `createdAt` — ISO 8601 формат
- Данные сохранены в БД

---

#### ❌ Негативные тесты (12 тестов)

| # | Название | Описание | Ожидаемый статус |
|---|----------|----------|------------------|
| 1 | **Отсутствие title** | Пустой title | `422` |
| 2 | **Слишком длинный title** | title > 50 символов | `422` |
| 3 | **XSS в title** | `<script>alert('xss')</script>` | `422` |
| 4 | **Слишком длинный description** | description > 1000 символов | `422` |
| 5 | **Невалидный iterationType** | `iterationType: invalid` | `422` |
| 6 | **Невалидный eventType** | `eventType: invalid` | `422` |
| 7 | **Невалидный startDate** | `startDate: "invalid-date"` | `422` |
| 8 | **endDate < startDate** | Некорректный диапазон дат | `400` |
| 9 | **weekly без recurrencePattern** | `iterationType: weekly`, нет pattern | `400` |
| 10 | **monthly без recurrencePattern** | `iterationType: monthly`, нет pattern | `400` |
| 11 | **recurrencePattern для oneTime** | `iterationType: oneTime`, есть pattern | `400` |
| 12 | **recurrencePattern для yearly** | `iterationType: yearly`, есть pattern | `400` |

**Дополнительные проверки recurrencePattern:**

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 13 | **Невалидный dayOfWeek** | `dayOfWeek: 7` (должно быть 0-6) | `400` |
| 14 | **Невалидный dayOfMonth** | `dayOfMonth: 32` (должно быть 1-31) | `400` |
| 15 | **Неправильный тип pattern** | `type: weekly` для `iterationType: monthly` | `400` |

---

### GET /api/groups/:groupId/calendar-events/:calendarEventId (Получение события)

#### ✅ Позитивные тесты (3 теста)

| # | Название | Описание |
|---|----------|----------|
| 1 | **Получение существующего события** | Валидный groupId и calendarEventId |
| 2 | **Получение события с recurrencePattern** | Событие с pattern в ответе |
| 3 | **Получение события без description** | Description отсутствует |

**Проверки:**
- Status code: `200`
- Response соответствует схеме `CALENDAR_EVENT_SCHEMA`
- Все поля присутствуют

---

#### ❌ Негативные тесты (4 теста)

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 1 | **Получение несуществующего события** | Валидный UUID, но события нет | `404` |
| 2 | **Невалидный calendarEventId** | `calendarEventId: "invalid-uuid"` | `422` |
| 3 | **Невалидный groupId** | `groupId: "invalid-uuid"` | `422` |
| 4 | **Чужое событие** | Событие в группе, где пользователь не состоит | `404` |

---

### GET /api/groups/:groupId/calendar-events (Список событий)

#### ✅ Позитивные тесты (13 тестов)

| # | Название | Описание |
|---|----------|----------|
| 1 | **Получение списка всех событий** | Без фильтров |
| 2 | **Фильтрация по eventType** | `?eventType=birthday` |
| 3 | **Фильтрация по периоду** | `?startDate=...&endDate=...` |
| 4 | **Комбинированная фильтрация** | `eventType` + период |
| 5 | **Пустой список** | В группе нет событий |
| 6 | **События внутри периода** | Возвращаются события где startDate в пределах периода |
| 7 | **События до периода** | События где startDate < query.startDate — не возвращаются |
| 8 | **События после периода** | События где startDate > query.endDate — не возвращаются |
| 9 | **Фильтрация только по startDate** | `?startDate=...` без endDate |
| 10 | **Фильтрация только по endDate** | `?endDate=...` без startDate |
| 11 | **oneTime события вне периода** | Не возвращаются |
| 12 | **weekly/monthly события** | Рекуррентные события возвращаются (игнорируют период) |
| 13 | **События с endDate в периоде** | События где endDate в пределах периода |

**Проверки:**
- Status code: `200`
- Response — массив объектов `CALENDAR_EVENT_SCHEMA`
- События отсортированы по `startDate ASC`

---

#### ❌ Негативные тесты (3 теста)

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 1 | **Невалидный groupId** | `groupId: "invalid"` | `422` |
| 2 | **Невалидный startDate** | `?startDate=invalid` | `422` |
| 3 | **Чужая группа** | Группа, где пользователь не состоит | `404` |

---

### PATCH /api/groups/:groupId/calendar-events/:calendarEventId (Обновление события)

#### ✅ Позитивные тесты (4 теста)

| # | Название | Описание |
|---|----------|----------|
| 1 | **Обновление title** | Изменение названия |
| 2 | **Обновление description** | Изменение описания |
| 3 | **Обновление обоих полей** | title + description |
| 4 | **Обнуление description** | `description: null` |

**Проверки:**
- Status code: `200`
- Обновлённые поля в ответе
- `id`, `createdAt` не изменились

---

#### ❌ Негативные тесты (6 тестов)

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 1 | **Пустой title** | `title: ""` | `422` |
| 2 | **Слишком длинный title** | `title: "a".repeat(51)` | `422` |
| 3 | **XSS в title** | `<script>...` | `422` |
| 4 | **Слишком длинный description** | `description: "a".repeat(1001)` | `422` |
| 5 | **Обновление несуществующего** | Валидный UUID, но нет события | `404` |
| 6 | **Чужое событие** | Событие в чужой группе | `404` |

---

### DELETE /api/groups/:groupId/calendar-events/:calendarEventId (Удаление события)

#### ✅ Позитивные тесты (2 теста)

| # | Название | Описание |
|---|----------|----------|
| 1 | **Удаление существующего события** | Валидное удаление |
| 2 | **Повторное получение удалённого** | GET после DELETE |

**Проверки:**
- Status code: `200`
- Событие удалено из БД (GET возвращает 404)

---

#### ❌ Негативные тесты (3 теста)

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 1 | **Удаление несуществующего** | Валидный UUID, но нет события | `404` |
| 2 | **Невалидный calendarEventId** | `calendarEventId: "invalid"` | `422` |
| 3 | **Чужое событие** | Событие в чужой группе | `404` |

---

## Тесты на права доступа (Access Control)

### Owner vs Member

| # | Название | Описание | Ожидаемый результат |
|---|----------|----------|---------------------|
| 1 | **Owner создаёт событие** | Владелец группы создаёт событие | `201` |
| 2 | **Member создаёт событие** | Участник группы создаёт событие | `201` |
| 3 | **Owner получает событие** | Владелец получает событие | `200` |
| 4 | **Member получает событие** | Участник получает событие | `200` |
| 5 | **Owner обновляет событие** | Владелец обновляет событие | `200` |
| 6 | **Member обновляет событие** | Участник обновляет событие | `200` |
| 7 | **Owner удаляет событие** | Владелец удаляет событие | `200` |
| 8 | **Member удаляет событие** | Участник удаляет событие | `200` |

---

### Non-member доступ (3 теста)

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 1 | **Не-участник: список** | GET /groups/:id/calendar-events | `404` |
| 2 | **Не-участник: создание** | POST /groups/:id/calendar-events | `404` |
| 3 | **Не-участник: получение** | GET /groups/:id/calendar-events/:eventId | `404` |

---

## Тесты на изоляцию данных (Data Isolation)

| # | Название | Описание |
|---|----------|----------|
| 1 | **События в разных группах** | Создать события в группе A и B, проверить что GET в группе A не возвращает события из B |
| 2 | **Удаление в одной группе** | Удалить событие в группе A, проверить что события в группе B не затронуты |

---

## Edge Cases (Граничные случаи)

| # | Название | Описание |
|---|----------|----------|
| 1 | **Событие с startDate = endDate** | Один день |
| 2 | **Событие с очень далёкой датой** | `startDate: 2100-01-01` |
| 3 | **Событие с Unicode в title** | `title: "🎉 День рождения 世界"` |
| 4 | **Событие с специальными символами** | `title: "Test @#$%^&*()"` |
| 5 | **Ежедневные события (multiple)** | Создание 100+ событий в группе |
| 6 | **Событие с null description** | Явное указание null |

---

## Security тесты

| # | Название | Описание | Статус |
|---|----------|----------|--------|
| 1 | **SQL injection в title** | `title: "Test'; DROP TABLE calendar_events; --"` | `422` или `201` (sanitized) |
| 2 | **SQL injection в description** | Аналогично | `422` или `201` |
| 3 | **IDOR: доступ к чужому событию** | Подмена calendarEventId | `404` |
| 4 | **IDOR: обновление чужого** | Подмена groupId + calendarEventId | `404` |
| 5 | **IDOR: удаление чужого** | Подмена groupId | `404` |
| 6 | **XSS в title** | `<script>alert('xss')</script>` | `422` |
| 7 | **XSS в description** | Аналогично | `422` |

---

## Итого: ~96 тестов

### Разбивка по категориям:

| Категория | Количество |
|-----------|------------|
| **POST (create)** | 8 позитивных + 15 негативных = 23 |
| **GET (single)** | 3 позитивных + 4 негативных = 7 |
| **GET (list)** | 13 позитивных + 3 негативных = 16 |
| **PATCH** | 4 позитивных + 6 негативных = 10 |
| **DELETE** | 2 позитивных + 3 негативных = 5 |
| **Access Control** | 8 (owner/member) + 3 (non-member) = 11 |
| **Data Isolation** | 2 |
| **Edge Cases** | 6 |
| **Security** | 7 |
| **Фильтрация (детальная)** | 8 |
| **ВСЕГО** | **~96 тестов** |

---

## Пример структуры теста

```typescript
describe('Calendar Events API Integration Tests', () => {
  let request: SuperTest<Test>;
  let owner: AuthTokens;
  let member: AuthTokens;
  let groupId: string;

  beforeAll(async () => {
    const context = globalThis.__TEST_CONTEXT__;
    request = createTestAgent(context.fastify);
    
    // Register users
    owner = await registerAndLogin(request);
    member = await registerAndLogin(request);
    
    // Create group and add member
    const createGroupResponse = await request
      .post('/api/groups')
      .set(createAuthHeaders(owner.authToken))
      .send(createGroupFixture());
    
    const groupResult = await context.postgres.query(
      'SELECT id FROM groups WHERE name = $1',
      [createGroupResponse.body.name]
    );
    groupId = groupResult.rows[0].id;
    
    // Invite member to group
    await request
      .post(`/api/groups/${groupId}/inviteUser`)
      .set(createAuthHeaders(owner.authToken))
      .send({ targetUserId: member.userId });
  });

  describe('POST /api/groups/:groupId/calendar-events', () => {
    it('should create one-time event successfully', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        iterationType: 'oneTime',
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const response = await request
        .post(`/api/groups/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: eventData.title,
        iterationType: eventData.iterationType,
      });
      expect(response.body.id).toBeUUID();
    });

    it('should create weekly event with recurrencePattern', async () => {
      const eventData = {
        title: 'Weekly Meeting',
        iterationType: 'weekly' as const,
        recurrencePattern: {
          type: 'weekly' as const,
          dayOfWeek: 1,
        },
        startDate: '2026-03-02T10:00:00.000Z',
      };

      const response = await request
        .post(`/api/groups/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.recurrencePattern).toEqual(eventData.recurrencePattern);
    });

    it('should reject weekly event without recurrencePattern', async () => {
      const eventData = {
        title: 'Invalid Weekly',
        iterationType: 'weekly' as const,
        startDate: '2026-03-02T10:00:00.000Z',
      };

      const response = await request
        .post(`/api/groups/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(400);
    });
  });

  // ... остальные тесты
});
```

---

## Приоритеты реализации

### Приоритет 1: Базовый CRUD (20 тестов)
- Создание one-time события
- Получение одного события
- Получение списка
- Обновление
- Удаление

### Приоритет 2: Валидация (15 тестов)
- Негативные тесты на CREATE
- Валидация recurrencePattern
- Валидация дат

### Приоритет 3: Access Control (11 тестов)
- Owner vs Member
- Non-member доступ

### Приоритет 4: Edge Cases + Security (13 тестов)
- XSS, SQL injection
- Unicode, special characters
- IDOR тесты

### Приоритет 5: Полное покрытие (остальные ~20 тестов)
