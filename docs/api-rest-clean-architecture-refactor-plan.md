# API REST Clean Architecture Refactoring Plan

## Цель

Привести `src/api/rest` к роли transport-адаптера и вынести orchestration/business-flow в application-слой по правилам Clean Architecture.

## Целевые границы слоев

- `api/rest`: только HTTP transport (routes, schemas, hooks, mappers, framework adapters).
- `application`: orchestration/use-case handlers.
- `domains`: интерфейсы/контракты/сущности/бизнес-правила.
- `infrastructure` (или текущие `repositories` + framework adapters): реализации внешних зависимостей.

Правило зависимостей: внешний слой зависит от внутреннего, внутренний от внешнего не зависит.

## Пошаговый план

### 1. Зафиксировать архитектурные правила

- Добавить короткий ADR/раздел в `README` с описанием слоев и направлений зависимостей.
- Зафиксировать, что `api/rest` не содержит бизнес-оркестрации.

### 2. Вынести Composition Root из `api/rest/composites`

- Создать `src/app/bootstrap/rest.ts` (или `src/app/di/rest.ts`).
- Перенести туда сборку зависимостей из:
  - `src/api/rest/index.ts`
  - `src/api/rest/composites/**`
- Оставить в `api/rest` только регистрацию endpoint и адаптеры.

### 3. Стабилизировать структуру `api/rest`

- Оставить в `api/rest`:
  - `routes/*`
  - `schemas/*`
  - `mappers/*` (добавить)
  - `hooks/*`
  - `adapters/*`
  - `types/*`, `constants/*`
- Удалить transport-несвойственные слои после миграции (`composites/*`).

### 4. Вынести auth orchestration из контроллера в `application/auth`

- Создать handlers:
  - `LoginHandler`
  - `RefreshTokensHandler`
  - `LogoutSessionHandler`
  - `LogoutSessionByIdHandler`
  - `LogoutAllSessionsHandler`
  - `GetSessionsHandler`
  - `ForgotPasswordEndHandler` (инвалидация сессий)
- Каждый handler принимает только интерфейсы (`domains/*`), без Fastify-зависимостей.

### 5. Сделать `AuthRoutesController` thin-controller

- Оставить в контроллере только:
  - чтение request/cookies/headers
  - schema validation
  - mapping request -> command
  - вызов handler
  - mapping result -> HTTP response
- Убрать из контроллера:
  - lifecycle orchestration сессий
  - blacklist loops
  - refresh flow orchestration

### 6. Завершить разделение JWT responsibility

- Уже сделано: `TokensSessionsGenerator` зависит от `IJwtSigner`, а Fastify реализует adapter.
- Следующий шаг:
  - добавить `ITokensVerifier` (или `IJwtVerifier`) в `domains/services`
  - Fastify-реализацию в `api/rest/adapters/jwt/*`
  - использовать verifier через интерфейс в application/auth и/или middleware.

### 7. Упростить и стандартизировать `authenticate`

- Оставить middleware в `api/rest`, но без бизнес-оркестрации.
- Логика:
  - verify access token
  - проверить blacklist (`ITokensSessionsBlacklistStore`)
  - записать `request.userId`

### 8. Нормализовать нейминг и экспорты

- Проверить единообразие:
  - `TokensSessionsStore`
  - `TokensSessionsBlacklistStore`
  - `TokensSessionsGenerator`
- Удалить legacy имена/мертвые экспорты.
- Проверить barrel `index.ts`, чтобы не было циклов и дублей.

### 9. Вынести DTO mapping в отдельные mapper-файлы

- Для каждого route:
  - `toCommand(request)`
  - `toResponse(result)`
- Сократить контроллеры и упростить unit-тесты handlers.

### 10. Централизовать error policy

- Application/domain слои возвращают/бросают только бизнес-ошибки.
- `api/rest/utils/errorsHandler.ts` содержит полный mapping ошибок в HTTP-коды.
- Минимизировать ручные `try/catch` в контроллерах.

### 11. Выполнять миграцию вертикальными срезами

Рекомендуемая последовательность:

1. `POST /auth/refresh-tokens`
2. `POST /auth/logout-session`
3. `POST /auth/logout-all-sessions`
4. `DELETE /auth/logout-session/:id`
5. `GET /auth/get-all-sessions`
6. `POST /auth/login`

После каждого среза:

- `npm run build`
- auth integration subset

### 12. Обновить тестовую стратегию

- Добавить unit-тесты на `application/auth/*` handlers.
- Оставить integration-тесты на HTTP-контракт.
- Обновить integration под cookie-only auth (где еще используется `Authorization` header).
- Проверить security-инварианты:
  - refresh rotation
  - blacklist старых access
  - logout current/other session
  - logout all invalidates все активные токены

### 13. Финальная зачистка

- Удалить `src/api/rest/composites/**` после полного переноса DI.
- Удалить неиспользуемые утилиты и файлы.
- Проверить, что `api/rest` не зависит от concrete business-сервисов, кроме framework adapters.

## Критерии готовности

- `api/rest` не содержит бизнес-оркестрации.
- Auth flow orchestration находится в `application/auth`.
- Внутренние слои не зависят от Fastify.
- Сборка проходит (`npm run build`).
- Интеграционные тесты проходят в окружении с контейнерным runtime.
