# Calendar Events Unification Plan

Цель: привести `calendar events` к тому же шаблону, что уже применён в `auth/groups/me`, без изменения публичного API-контракта.

## Статус

- [x] PR1 — Split Domain UseCase Interfaces (per scenario)
- [x] PR2 — Split Application UseCases (per scenario classes)
- [x] PR3 — Controller Style унификация (`#registerX`)
- [x] PR4 — Mappers Contract унификация (`toXCommand` / `toXResponse`)
- [ ] PR5 — Bootstrap / Composition унификация (`buildXUseCases`)
- [ ] PR6 — Error Policy Cleanup (expected vs unexpected)
- [ ] PR7 — Barrel Cleanup
- [ ] PR8 — Финальная верификация

## Текущее состояние (baseline)

- В домене используется агрегатный контракт:
  - `ICalendarEventsUseCases` в `src/domains/useCases/calendarEvents.ts`
- В application один монолитный класс:
  - `CalendarEventsUseCases` в `src/useCases/calendarEvents/calendarEvents.ts`
- Контроллер зависит от агрегата и регистрирует роуты inline.
- Bootstrap создаёт один агрегатный use case без сценарной декомпозиции.

## PR1 — Split Domain UseCase Interfaces (per scenario)

1. Разбить `ICalendarEventsUseCases` на сценарные интерфейсы:
   - `IListCalendarEventsUseCase`
   - `IGetCalendarEventUseCase`
   - `ICreateCalendarEventUseCase`
   - `IPatchCalendarEventUseCase`
   - `IDeleteCalendarEventUseCase`
2. Каждый интерфейс — метод `execute(...)`.
3. Обновить `src/domains/useCases/index.ts` и `calendarEvents` exports.

Файлы:
- `src/domains/useCases/calendarEvents.ts` (удаление/замена)
- `src/domains/useCases/calendarEvents/*` (новые файлы)
- `src/domains/useCases/index.ts`

## PR2 — Split Application UseCases (per scenario classes)

1. Разбить `CalendarEventsUseCases` на 5 классов по сценариям.
2. Вынести общие private helper’ы в `shared/*`:
   - проверка membership;
   - загрузка события `findOneOrThrow`;
   - валидации recurrence/date range.
3. Сохранить текущую бизнес-логику и ошибки.

Файлы:
- `src/useCases/calendarEvents/calendarEvents.ts` (удаление/замена)
- `src/useCases/calendarEvents/*.ts` (сценарные классы)
- `src/useCases/calendarEvents/shared/*`

## PR3 — Controller Style унификация

1. Перевести `CalendarEventsRoutesController` на стиль:
   - `register()`
   - `#registerGetList/#registerGet/#registerCreate/#registerPatch/#registerDelete`
2. Контроллер должен зависеть от сценарных интерфейсов, не от агрегата.

Файл:
- `src/api/rest/routes/calendarEvents/controller.ts`

## PR4 — Mappers Contract унификация

1. Проверить пары `toXCommand` / `toXResponse` на единый стиль.
2. Привести сигнатуры к `props`-объекту (где сейчас не так).
3. Оставить поведение сериализации/нормализации без изменения.

Файл:
- `src/api/rest/mappers/calendarEvents.ts`

## PR5 — Bootstrap / Composition унификация

1. Добавить `buildCalendarEventsUseCases(...)`.
2. Создавать сценарные use-case инстансы и передавать их в контроллер.
3. Удалить зависимость bootstrap от агрегатного класса.

Файл:
- `src/api/rest/bootstrap/calendarEvents.ts`

## PR6 — Error Policy Cleanup

1. Убрать лишние `try/catch`, где они только логируют и rethrow.
2. Оставить явные `BusinessError` как expected ветки.
3. Привести стиль к `auth/groups/me`.

Файл:
- `src/useCases/calendarEvents/*`

## PR7 — Barrel Cleanup

1. Обновить `index.ts` в `domains/useCases`, `useCases`, `calendarEvents`.
2. Удалить legacy-экспорты агрегата, если останутся.

Файлы:
- `src/domains/useCases/index.ts`
- `src/useCases/index.ts`
- `src/domains/useCases/calendarEvents/*`
- `src/useCases/calendarEvents/*`

## PR8 — Финальная верификация

1. `npm run build`
2. Integration smoke по `calendarEvents` (в среде с доступным container runtime).
3. Проверка, что public API не поменялся.
