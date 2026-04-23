# Groups Clean Architecture Refactor Plan

Статус-документ по полной переработке `groups`-среза в стиле Clean Architecture.
Документ обновляется после каждого завершенного PR-этапа.

## Цель

Привести `groups` к тому же уровню архитектурной чистоты, что `auth/users/me`:

- тонкий REST transport;
- application orchestration по сценариям;
- доменные инварианты в entities/VO;
- предсказуемая error policy;
- безопасные транзакционные границы для конкурентных операций.

## Ограничения

- Публичный API-контракт `groups` не меняем.
- Рефакторинг делаем по PR-этапам, без "большого взрыва".
- Тесты идут отдельным этапом после стабилизации кода.

## Целевые границы слоёв

- `api/rest`:
  - routes/controller/schemas/mappers;
  - только transport-логика (request/response mapping, валидация, вызов use case).
- `application` (`useCases/groups/*`):
  - orchestration по сценариям;
  - бизнес-последовательность шагов;
  - работа с транзакцией через интерфейс.
- `domains`:
  - интерфейсы use cases/services/repositories;
  - сущности и value objects (`GroupName`, `GroupDescription`);
  - бизнес-инварианты уровня модели.
- `infrastructure` (`repositories`, `pkg/dbTransaction` adapter):
  - SQL и внешние IO-детали;
  - реализация интерфейсов домена/application.

Правило зависимостей: внешний слой зависит от внутреннего, внутренний от внешнего не зависит.

## Сценарные Use Cases (целевая модель)

- `ListUserGroupsUseCase`
- `CreateUserGroupUseCase`
- `GetUserGroupUseCase`
- `PatchUserGroupUseCase`
- `InviteUserInGroupUseCase`
- `ExcludeUserFromGroupUseCase`
- `DeleteUserGroupUseCase`

Aggregate-класс `GroupsUseCases` удален; transport зависит от сценарных use case напрямую.

## Ключевые инварианты

- Только owner может patch/invite/exclude/delete.
- Один owner на группу.
- `maxGroups` для пользователя.
- `maxUsers` для группы.
- Нельзя исключить owner самим собой через `exclude`.
- Удаление группы только при единственном участнике.

## Текущие риски (baseline)

- Слабые VO-инварианты на уровне `Group` entities.
- Транзакционный контракт пока завязан на `pkg` слой.
- Интеграционные тесты групп рассинхронизированы с cookie-only auth контрактом.

## Этапы и статусы

- [x] PR1 — Architecture Baseline & Plan Freeze
- [x] PR2 — Split Domain UseCase Interfaces (per scenario)
- [x] PR3 — Split Application UseCases (per scenario classes)
- [x] PR4 — Bootstrap/Controller Wiring to Scenario UseCases
- [x] PR5 — Group Value Objects Integration
- [x] PR6 — Transaction Boundary Interface + Concurrency Hardening
- [x] PR7 — Error Policy Alignment (expected vs unexpected)
- [x] PR8 — Groups Mappers & PATCH Contract Cleanup
- [x] PR9 — Repositories Cleanup (`groups`, `groups_users`)
- [x] PR10 — Docs Sync + Legacy Cleanup
- [ ] PR11 — Tests (integration + unit)

## Definition of Done (для всего плана)

- `groups` не содержит aggregate use case-монолита.
- Все `groups`-сценарии представлены отдельными use case-классами.
- Контроллер transport-only.
- Домен хранит инварианты в VO/сущностях, а не только в REST schema.
- Ожидаемые ветки не дают 500.
- Конкурентные сценарии защищены транзакционно.
- Документация соответствует фактической структуре.
