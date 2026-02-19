# Agent - Инструкция по проекту

> **Файл для AI-ассистента.** Содержит всю необходимую информацию для работы с проектом.

## Обзор проекта

**Название:** be-family-time  
**Назначение:** Backend API для семейного приложения "Family Time"  
**Тип:** REST API (Fastify + TypeScript + PostgreSQL + Redis)

### Стек технологий

| Категория | Технологии |
|-----------|------------|
| Язык | TypeScript (Node.js) |
| Веб-фреймворк | Fastify v5 |
| База данных | PostgreSQL (pg v8) |
| Кэш | Redis (redis v5) |
| Валидация | Zod v4 |
| Аутентификация | JWT (@fastify/jwt) |
| Документация | @fastify/swagger-ui |
| Тестирование | Jest v30 |
| Логирование | Pino v10 |
| Хеширование | argon2 v0.44 |
| Контейнеризация | Docker, Docker Compose |

### Архитектура (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Fastify)                  │
│              src/api/rest/ — routes, schemas            │
├─────────────────────────────────────────────────────────┤
│                 Domain Layer (Business Logic)           │
│    src/domains/ — useCases, services, repositories      │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer (pkg)              │
│    src/pkg/ — postgres, redis, logger, generators       │
└─────────────────────────────────────────────────────────┘
```

## Структура проекта

```
be-family-time/
├── config/env.yaml          # Конфигурация (порты, URI, TTL, секреты)
├── src/
│   ├── api/rest/            # API слой
│   │   ├── composites/      # Композиторы (AuthComposite, etc.)
│   │   ├── routes/          # Маршруты
│   │   ├── schemas/         # Zod схемы валидации
│   │   ├── hooks/           # Fastify hooks
│   │   └── utils/           # Утилиты API
│   ├── config/              # Загрузка и валидация конфига
│   ├── domains/             # Доменная логика
│   │   ├── repositories/    # Репозитории (db/, stores/)
│   │   ├── useCases/        # Варианты использования
│   │   └── services/        # Доменные сервисы
│   ├── pkg/                 # Инфраструктура
│   │   ├── errors.ts        # Обработка ошибок
│   │   ├── postgres.ts      # PostgreSQL клиент
│   │   ├── redis.ts         # Redis клиент
│   │   ├── generators.ts    # Генераторы кодов/токенов
│   │   ├── logger.ts        # Pino логгер
│   │   └── fastify.ts       # Настройка Fastify
│   ├── services/            # Сервисы (crypto, jwt, users, otpCodes)
│   ├── repositories/        # Репозитории
│   ├── entities/            # Сущности
│   ├── tests/               # Тесты (__mocks__, api, units)
│   ├── types/               # TypeScript типы
│   └── index.ts             # Точка входа
├── migrations/              # Миграции БД (node-pg-migrate)
├── build/                   # Скомпилированный код
├── coverage/                # Покрытие тестами
├── docker-compose.yaml      # Docker Compose (app, postgres, redis)
├── package.json             # Зависимости и скрипты
├── tsconfig.json            # TypeScript конфиг
├── jest.config.js           # Jest конфиг
├── eslint.config.mjs        # ESLint конфиг
├── .prettierrc.js           # Prettier конфиг
└── nodemon.json             # Nodemon конфиг
```

## Быстрые команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки (nodemon) |
| `npm run build` | Сборка TypeScript → `build/` |
| `npm test` | Запуск всех тестов (Jest) |
| `npm run test:services` | Тесты сервисов |
| `npm run test:api` | API тесты (--runInBand) |
| `npm run test:units` | Unit тесты |
| `npx eslint .` | Проверка линтером |
| `npx eslint --fix` | Автоисправление ошибок |
| `docker-compose up -d` | Запуск PostgreSQL + Redis |
| `npm run migrations:down` | Применить миграции БД |
| `npm run migrations:create` | Создать миграцию |

## Конфигурация

**Файл:** `config/env.yaml`

**Ключевые параметры:**
- `server.port` — порт (default: 8000)
- `postgres.uri` — строка подключения к PostgreSQL
- `redis.uri` — строка подключения к Redis
- `ttls.registrationCode` — TTL кода регистрации
- `ttls.restoreCode` — TTL кода восстановления
- `jwt.accessTokenTtl` / `refreshTokenTtl` — время жизни токенов
- `salts.hash` / `salts.encryption` — соли для хеширования/шифрования

**Загрузка конфига:** `src/config/index.ts` (валидация через Zod)

## API

**Базовый путь:** `/api`  
**Swagger UI:** доступен в dev-режиме

**Основные эндпоинты:**
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `POST /api/auth/logout` — выход
- `POST /api/auth/refresh` — обновление токена
- `GET /api/me` — профиль пользователя
- `POST /api/auth/restore-password` — запрос восстановления пароля
- `POST /api/auth/reset-password` — сброс пароля

**Особенности:**
- В dev-режиме OTP-коды возвращаются в заголовке `X-Dev-Otp-Code`
- Rate limiting на критичных эндпоинтах
- Cookie-based refresh токены

## Известные проблемы

| Файл | Проблема | Статус |
|------|----------|--------|
| `src/tests/api/me.test.ts` | Падают тесты (401/400 вместо 200) | ❌ Требуется фикс |
| `coverage/` | ESLint сканирует coverage файлы | ⚠️ Добавить в ignore |
| `build/` | Дублирует mock nanoid | ⚠️ Требуется clean |

## Правила для AI-ассистента

1. **Импорты:** Использовать `@/` для `src/` (настроено в tsconfig.json)
2. **Тесты:** Суффикс `.test.ts`, Jest фреймворк
3. **Стиль:** TypeScript strict mode, Prettier форматирование
4. **Архитектура:** Не нарушать слои (API → Domain → Infrastructure)
5. **Логирование:** Pino через `src/pkg/logger.ts`
6. **Ошибки:** Кастомные классы ошибок в `src/pkg/errors.ts`
