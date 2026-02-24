# BE-family-time — Проект контекст

## Описание
Backend-сервис для управления семейными группами (Fastify + PostgreSQL + Redis + TypeScript)

## Стек
| Категория | Технологии |
|-----------|------------|
| **Фреймворк** | Fastify 5.x |
| **Язык** | TypeScript 5.x (ES2020, CommonJS) |
| **БД** | PostgreSQL 16.3 (node-pg-migrate для миграций) |
| **Кэш** | Redis 7.4 |
| **Аутентификация** | JWT (@fastify/jwt), argon2 для хеширования паролей |
| **Валидация** | Zod + fastify-type-provider-zod |
| **Тесты** | Jest + ts-jest |
| **Линтинг** | ESLint 9.x + Prettier |

## Архитектура
```
src/
├── api/rest/          # HTTP слой (Fastify роуты, контроллеры, схемы)
├── entities/          # Доменные сущности (User, Group, UsersGroups)
├── services/          # Бизнес-логика (users, groups, crypto, jwt, rateLimiter)
├── repositories/      # Доступ к ДБ (db/) и хранилища (stores/)
├── domains/           # Интерфейсы для DI (repositories, services, useCases)
├── useCases/          # Сценарии использования (auth, groups, me)
├── pkg/               # Инфраструктура (logger, postgres, redis, errors, generators)
└── config/            # Конфигурация
```

## Доменная модель
- **User** — пользователи (email/phone зашифрованы, password захеширован)
- **Group** — группы (name, description)
- **UsersGroups** — связь многие-ко-многим (user_id, group_id, is_owner)

## API (порт 8000)
| Префикс | Описание |
|---------|----------|
| `/api/auth/*` | Регистрация (2 этапа), логин, refresh токенов, logout, сессии |
| `/api/groups/*` | CRUD групп |
| `/api/me/*` | Профиль текущего пользователя |

## Ключевые особенности
- Двухэтапная регистрация с OTP-кодом (Redis, TTL 600 сек)
- Шифрование персональных данных (AES) + HMAC для поиска
- Rate limiting (rate-limiter-flexible)
- JWT: access (5 мин), refresh (30 дней) в cookie
- Лимиты: макс. 3 группы на пользователя, макс. 2 пользователя на группу

## Конфигурация
- **DB:** `postgresql://root:root@localhost:5432/postgres`
- **Redis:** `redis://default:root@localhost:6379`
- **Запуск:** `npm run dev` (nodemon), `npm run build` (tsc)

## Миграции
1. `users` — пользователи (encrypted email/phone, hashed password)
2. `groups` — группы
3. `users_groups` — связь пользователей с группами

## Команды
```bash
npm run dev              # Запуск в режиме разработки
npm run build            # Сборка TypeScript
npm run test             # Запуск всех тестов
npm run test:services    # Тесты сервисов
npm run test:api         # API тесты
npm run test:units       # Юнит-тесты
npm run migrations:up    # Применить миграции
npm run migrations:create # Создать миграцию
```
