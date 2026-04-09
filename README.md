# BE Family Time

Backend REST API для семейного календаря и управления семейными группами.

Документ задуман как живая техническая документация проекта. При последующих изменениях логики, схем, маршрутов и инфраструктуры его стоит обновлять вместе с кодом.

## Что умеет сервис

- регистрация пользователя по OTP-коду;
- логин с access token в заголовке и refresh token в cookie;
- восстановление пароля по OTP-коду;
- просмотр и обновление собственного профиля;
- создание семейных групп, приглашение и исключение участников;
- создание и управление календарными событиями группы;
- Swagger UI в dev-режиме;
- интеграционные тесты на PostgreSQL и Redis через Testcontainers.

## Стек

- TypeScript
- Node.js
- Fastify
- PostgreSQL
- Redis
- Zod
- JWT
- Pino
- Jest
- Testcontainers

## Структура проекта

```text
src/
  api/rest/              HTTP-слой: Fastify, роуты, схемы, hooks, auth, tokens
  useCases/              прикладные сценарии
  services/              бизнес-сервисы и оркестрация над репозиториями
  repositories/          реализация доступа к PostgreSQL и Redis
  domains/               интерфейсы use cases, сервисов и репозиториев
  entities/              сущности и value objects
  pkg/                   инфраструктурные утилиты: fastify, logger, db, redis, errors
  tests/                 unit/integration тесты и test helpers

migrations/              SQL-миграции
config/env.yaml          runtime-конфигурация
docker-compose.yaml      локальные PostgreSQL и Redis
api/                     Bruno-коллекция запросов
PROJECT_CONTEXT.md       короткий технический snapshot для быстрых задач
```

## Архитектурная схема

Зависимости идут сверху вниз:

`routes/controllers -> useCases -> services -> repositories -> PostgreSQL/Redis`

Ключевые уровни:

- `src/api/rest`: HTTP-адаптер, валидация, авторизация, сериализация ответов.
- `src/useCases`: бизнес-правила уровня сценариев.
- `src/services`: доменные операции над пользователями, группами, календарём, crypto и rate limit.
- `src/repositories`: SQL/Redis-реализация.
- `src/entities`: типизированные сущности и объекты для передачи между слоями.

Точка входа приложения: [src/index.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/index.ts)

REST-приложение собирается в [src/api/rest/index.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/api/rest/index.ts)

## Основные сценарии

### Auth

- `POST /api/auth/registration-start`
- `POST /api/auth/registration-end`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password-start`
- `POST /api/auth/forgot-password-end`
- `GET /api/auth/get-all-sessions`
- `POST /api/auth/logout-all-sessions`
- `POST /api/auth/logout-session`
- `POST /api/auth/refresh-tokens`

Основная логика: [src/useCases/auth/auth.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/useCases/auth/auth.ts)

Особенности:

- OTP в dev-режиме возвращается в заголовке `x-dev-otp-code`.
- При логине access token возвращается в заголовке `Authorization`, refresh token кладётся в cookie.
- Сессии refresh token хранятся в Redis.
- Есть rate limit по контакту пользователя.

### Me

- `GET /api/me`
- `PATCH /api/me`

Основная логика: [src/useCases/me/me.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/useCases/me/me.ts)

Особенности:

- профиль возвращается в расшифрованном виде;
- поддерживаются `timeZone`, `language`, `firstName`, `lastName`, `dateOfBirth`;
- `email` и `phone` хранятся отдельно от `personalInfo`.

### Groups

- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/:groupId`
- `PATCH /api/groups/:groupId`
- `DELETE /api/groups/:groupId`
- `POST /api/groups/:groupId/inviteUser`
- `POST /api/groups/:groupId/excludeUser`

Основная логика: [src/useCases/groups/groups.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/useCases/groups/groups.ts)

Бизнес-правила:

- у пользователя ограничено число групп `CONFIG.limits.user.maxGroups`;
- у группы ограничено число участников `CONFIG.limits.group.maxUsers`;
- владелец группы один;
- приглашать и исключать пользователей может только владелец;
- владелец не может исключить сам себя через `excludeUser`;
- удалить группу можно только если в ней остался один участник.

### Calendar Events

- `GET /api/groups/:groupId/calendar-events`
- `POST /api/groups/:groupId/calendar-events`
- `GET /api/groups/:groupId/calendar-events/:calendarEventId`
- `PATCH /api/groups/:groupId/calendar-events/:calendarEventId`
- `DELETE /api/groups/:groupId/calendar-events/:calendarEventId`

Основная логика: [src/useCases/calendarEvents/calendarEvents.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/useCases/calendarEvents/calendarEvents.ts)

Поддерживаемые типы:

- `eventType`: `birthday | vacation | holiday`
- `iterationType`: `oneTime | weekly | monthly | yearly`

Правила recurrence:

- `oneTime` и `yearly` не должны содержать `recurrencePattern`;
- `weekly` требует `{ type: 'weekly', dayOfWeek: 0..6 }`;
- `monthly` требует `{ type: 'monthly', dayOfMonth: 0..30 }`;
- `endDate` не может быть раньше `startDate`.

## Данные и хранение

### Пользователь

Схема задаётся миграцией [migrations/1_create_users_table.sql](/Users/sergei/Documents/my-projects/BE-family-time/migrations/1_create_users_table.sql)

Что хранится:

- `email`, `phone`: в двух видах
  - `*_hashed` для поиска и уникальности;
  - `*_encrypted` для восстановления исходного значения;
- `firstName`, `lastName`: в зашифрованном виде;
- `dateOfBirth`: в открытом виде;
- `timeZone`, `language`: отдельные поля профиля;
- `password_hashed`: argon2-хэш;
- `encryption_salt`: индивидуальная соль пользователя.

Поток обработки пользователя реализован в [src/services/users/users.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/services/users/users.ts)

### Группы

Схемы:

- [migrations/2_create_groups_table.sql](/Users/sergei/Documents/my-projects/BE-family-time/migrations/2_create_groups_table.sql)
- [migrations/3_create_groups-users_table.sql](/Users/sergei/Documents/my-projects/BE-family-time/migrations/3_create_groups-users_table.sql)

Модель:

- `groups` хранит саму группу;
- `groups_users` хранит membership и флаг `is_owner`;
- уникальный индекс `uniq_group_owner` гарантирует одного owner на группу.

### Календарные события

Схема: [migrations/4_create_calendar-events_table.sql](/Users/sergei/Documents/my-projects/BE-family-time/migrations/4_create_calendar-events_table.sql)

Что важно:

- событие всегда привязано к группе;
- автор события хранится в `creator_user_id`;
- `recurrence_pattern` хранится как `JSONB`;
- на уровне БД есть проверки `event_type`, `iteration_type`, `check_dates`.

Репозиторий: [src/repositories/db/calendarEvents/calendarEvents.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/repositories/db/calendarEvents/calendarEvents.ts)

## Аутентификация и сессии

Сервис токенов: [src/api/rest/services/tokens/tokens.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/api/rest/services/tokens/tokens.ts)

Текущее поведение:

- access token подписывается Fastify JWT и живёт `CONFIG.jwt.access.expiry`;
- refresh token подписывается Fastify JWT и живёт `CONFIG.jwt.refresh.expiry`;
- refresh token хранится в cookie;
- access token blacklist реализован в памяти процесса;
- refresh sessions хранятся в Redis.

Следствие:

- blacklist access token не переживает рестарт процесса;
- refresh sessions переживают рестарт, пока жив Redis.

## Конфигурация

Конфиг загружается из [config/env.yaml](/Users/sergei/Documents/my-projects/BE-family-time/config/env.yaml) и валидируется Zod-схемой в [src/config/index.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/config/index.ts)

Основные секции:

- `nodeEnv`
- `server.host`, `server.port`
- `postgres.uri`
- `redis.uri`
- `ttls`
- `codesLength`
- `salts`
- `jwt`
- `cookie`
- `limits`

## Локальный запуск

### 1. Поднять инфраструктуру

```bash
docker compose up -d
```

### 2. Применить миграции

```bash
npm run migrations:up
```

### 3. Запустить приложение

```bash
npm run dev
```

Сервис по умолчанию стартует на `http://localhost:8000`

Swagger UI в dev-режиме:

- [http://localhost:8000/doc](http://localhost:8000/doc)

## Полезные команды

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm test
npm run test:integration
npm run test:auth
npm run test:groups
npm run test:me
```

## Тестирование

Тестовая инфраструктура настраивается в [src/tests/utils/test-setup.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/tests/utils/test-setup.ts)

Что важно:

- интеграционные тесты используют Testcontainers;
- для запуска нужен доступ к Docker runtime;
- тесты поднимают отдельные PostgreSQL и Redis контейнеры;
- миграции применяются автоматически в тестовой среде.

Основные наборы:

- [src/tests/integration/auth.test.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/tests/integration/auth.test.ts)
- [src/tests/integration/groups.test.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/tests/integration/groups.test.ts)
- [src/tests/integration/me.test.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/tests/integration/me.test.ts)
- [src/tests/integration/calendarEvents.test.ts](/Users/sergei/Documents/my-projects/BE-family-time/src/tests/integration/calendarEvents.test.ts)

## Bruno-коллекция

Для ручной проверки API можно использовать Bruno-коллекцию из каталога [api](/Users/sergei/Documents/my-projects/BE-family-time/api)

В ней уже разложены запросы по доменам:

- `auth`
- `me`
- `groups`
- `calendarEvents`

## Известные технические замечания

Это не блокирует чтение проекта, но важно помнить при поддержке:

- `docker-compose.yaml` поднимает PostgreSQL с базой `main`, а `config/env.yaml` и `npm run migrations:up` смотрят на базу `postgres`. Для локального запуска эти настройки нужно привести к одному значению.
- `docker-compose.yaml` задаёт `REDIS_PASSWORD`, но стандартный образ Redis не начинает требовать пароль только из-за env-переменной. При этом `config/env.yaml` ожидает авторизацию `root`. Конфигурацию Redis лучше синхронизировать.
- В `calendar_events.creator_user_id` указано `NOT NULL` вместе с `ON DELETE SET NULL`. Такое сочетание в схеме противоречиво и требует пересмотра миграции.
- В проекте активно используются `TIMESTAMP`, а не `TIMESTAMPTZ`, поэтому правила работы с часовыми поясами стоит проверять отдельно при развитии календаря.
- Репозиторий календарных событий сейчас возвращает recurring-события при фильтрации периода без полноценного расчёта вхождений; это важно учитывать при развитии календарной логики.

## Как поддерживать эту документацию

При изменениях в проекте обновлять минимум следующие разделы:

- маршруты и payload API;
- конфигурацию и переменные;
- миграции и структуру данных;
- ограничения и бизнес-правила;
- команды запуска и тестирования;
- раздел с известными техническими замечаниями.

Если меняется архитектурный слой, точка входа или способ аутентификации, нужно обновить и этот `README.md`, и [PROJECT_CONTEXT.md](/Users/sergei/Documents/my-projects/BE-family-time/PROJECT_CONTEXT.md).
