# Auth / Groups / Me Unification Plan

Цель: привести `auth`, `groups`, `me` к единому шаблону реализации без изменения публичного API-контракта.

## Статус

- [x] PR1 — UseCases API унификация
- [x] PR2 — Controller Style унификация
- [x] PR3 — Bootstrap / Composition унификация
- [x] PR4 — Mappers Contract унификация
- [x] PR5 — Schemas / Constants нейминг
- [x] PR6 — Barrels Cleanup
- [x] PR7 — Архитектурная фиксация в документации
- [ ] PR8 — Финальная верификация

## PR1 — UseCases API унификация

1. Привести `groups`-интерфейсы и классы к `execute(...)` вместо `createUserGroup/findUserGroup/...`.
2. Обновить вызовы в `groups` controller.
3. Не менять бизнес-логику, только контракт вызова.

Файлы:
- `src/domains/useCases/groups/*`
- `src/useCases/groups/*`
- `src/api/rest/routes/groups/controller.ts`

## PR2 — Controller Style унификация

1. Использовать единый стиль регистрации маршрутов: приватные `#registerX()` методы.
2. Привести `groups` и `me` к этому формату.
3. Вынести повторяемые куски в приватные helpers внутри контроллеров.

Файлы:
- `src/api/rest/routes/groups/controller.ts`
- `src/api/rest/routes/me/controller.ts`

## PR3 — Bootstrap / Composition унификация

1. Для каждого модуля применить одинаковый паттерн сборки зависимостей.
2. Добавить локальные `buildXUseCases(...)` в bootstrap-файлы.
3. Оставить DI явным и предсказуемым.

Файлы:
- `src/api/rest/bootstrap/auth.ts`
- `src/api/rest/bootstrap/groups.ts`
- `src/api/rest/bootstrap/me.ts`

## PR4 — Mappers Contract унификация

1. Проверить и выровнять пары `toXCommand` / `toXResponse`.
2. Убрать неоднородные нейминги и сигнатуры.
3. Зафиксировать правило в документации.

Файлы:
- `src/api/rest/mappers/auth.ts`
- `src/api/rest/mappers/groups.ts`
- `src/api/rest/mappers/me.ts`
- `src/api/rest/mappers/index.ts`

## PR5 — Schemas / Constants нейминг

1. Унифицировать экспорт схем (`SCHEMAS`) и naming-конвенцию маршрутов/констант.
2. Не менять поведение валидации, только структура/стиль.

Файлы:
- `src/api/rest/routes/auth/schemas.ts`
- `src/api/rest/routes/groups/schemas.ts`
- `src/api/rest/routes/me/schemas.ts`

## PR6 — Barrels Cleanup

1. Убрать дубли и лишние реэкспорты.
2. Сделать единый принцип экспорта по слоям.
3. Проверить стабильность импортов по проекту.

Файлы:
- `src/useCases/index.ts`
- `src/domains/useCases/index.ts`
- при необходимости другие `index.ts`

## PR7 — Архитектурная фиксация в документации

1. Добавить документ с эталонным шаблоном модуля.
2. Зафиксировать правила:
- controller = transport-only;
- use case = orchestration + `execute`;
- mapper = only mapping;
- bootstrap = composition only.

Файл:
- `docs/api-rest-module-template.md`

## PR8 — Финальная верификация

1. `npm run build`
2. smoke-проверка по `auth/groups/me`
3. сверка, что API-контракт не изменился
