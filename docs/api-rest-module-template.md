# API REST Module Template

Эталонный шаблон модуля для `api/rest` в стиле Clean Architecture.

## Цель

Сделать все модули (`auth`, `groups`, `me`, новые срезы) одинаковыми по структуре, неймингу и границам ответственности.

## Структура модуля

Пример для модуля `foo`:

- `src/api/rest/routes/foo/`
  - `controller.ts`
  - `schemas.ts`
  - `constants.ts`
  - `index.ts`
- `src/api/rest/mappers/foo.ts`
- `src/api/rest/bootstrap/foo.ts`
- `src/domains/useCases/foo/*`
- `src/useCases/foo/*`

## Правила по слоям

### 1) Controller (`api/rest/routes/*/controller.ts`)

- Только transport-логика:
  - чтение `request`;
  - вызов use case;
  - отправка `reply`.
- Не содержит бизнес-правил.
- Использует стиль приватных регистраторов:
  - `register()`
  - `#registerX(router)`.
- Работает только через `SCHEMAS` и `ROUTES`.

### 2) Schemas (`api/rest/routes/*/schemas.ts`)

- Экспорт строго `SCHEMAS` через `Object.freeze`.
- Ключи `SCHEMAS` синхронизированы с `ROUTES` по смыслу и неймингу.
- Валидация и docs-метаданные находятся только здесь.

### 3) Mappers (`api/rest/mappers/*.ts`)

- Имена:
  - `toXCommand`
  - `toXResponse`.
- Сигнатуры единообразные:
  - вход через объект `props`;
  - без “сырой” бизнес-логики.
- Мапперы не ходят в сервисы/репозитории.

### 4) Application Use Cases (`useCases/*`)

- Каждый сценарий — отдельный класс.
- Публичный метод сценария: `execute(...)`.
- В классе:
  - orchestration;
  - вызовы domain services/repositories;
  - без transport-кода.

### 5) Domain UseCase Interfaces (`domains/useCases/*`)

- На каждый сценарий отдельный интерфейс.
- Метод интерфейса: `execute(...)`.
- Контракты не зависят от Fastify/HTTP.

### 6) Bootstrap (`api/rest/bootstrap/*`)

- Только composition root:
  - создание concrete use cases;
  - wiring зависимостей;
  - создание контроллера.
- Рекомендуемый паттерн:
  - `buildXUseCases(deps)`
  - `registerXRoutes(deps)`.

## Нейминг и экспорты

- `SCHEMAS`, `ROUTES`, `PREFIX` — единый стиль.
- Barrel-файлы (`index.ts`) без deep-экспортов.
- Главные barrel-файлы экспортируют только модульные index, без дублей.

## Do / Don’t

### Do

- Использовать `execute(...)` для use case сценариев.
- Держать контроллеры тонкими.
- Нормализацию входа делать в мапперах/VO.
- Проверять сборку после рефакторинга (`npm run build`).

### Don’t

- Не добавлять бизнес-логику в контроллер.
- Не делать deep-export вида `./module/file`.
- Не смешивать контракты разных сценариев в один “универсальный” use case.

## Definition of Done для нового модуля

- Есть `routes + schemas + constants + mappers + bootstrap`.
- Все сценарии представлены отдельными `execute` use cases.
- Контроллер transport-only.
- Barrel-файлы чистые, без дублей и deep-экспортов.
- `npm run build` проходит.

