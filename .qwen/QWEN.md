# BE-family-time — Проект контекст

## Описание
Backend-сервис для управления семейными группами (Fastify + PostgreSQL + Redis + TypeScript)

## Стек
| Категория | Технологии |
|-----------|------------|
| **Фреймворк** | Fastify 5.x |
| **Язык** | TypeScript 5.x (ES2020, CommonJS, ESM modules) |
| **БД** | PostgreSQL 16.3 (node-pg-migrate для миграций) |
| **Кэш** | Redis 7.4 (redis 5.x) |
| **Аутентификация** | JWT (@fastify/jwt), argon2 для хеширования паролей |
| **Валидация** | Zod 4.x + fastify-type-provider-zod |
| **Тесты** | Jest 30.x + ts-jest |
| **Линтинг** | ESLint 9.x + Prettier 3.x |
| **Rate Limiting** | rate-limiter-flexible 9.x |

## Архитектура
```
src/
├── api/rest/                    # HTTP слой (Fastify)
│   ├── composites/              # Композиты (Auth, Groups, Me)
│   ├── constants/               # Константы (cookie, headers)
│   ├── domains/                 # Интерфейсы API (middlewares)
│   ├── hooks/                   # Fastify hooks
│   ├── middlewares/             # Middleware (authMiddleware)
│   ├── routes/                  # Роуты (auth, groups, me)
│   ├── schemas/                 # Глобальные схемы
│   ├── types/                   # TypeScript типы
│   └── utils/                   # Утилиты (globalErrorHandler)
├── config/                      # Конфигурация (env.yaml, валидация Zod)
├── domains/                     # Интерфейсы для DI
│   ├── repositories/            # Интерфейсы репозиториев (db/, stores/)
│   ├── services/                # Интерфейсы сервисов
│   └── useCases/                # Интерфейсы useCase
├── entities/                    # Доменные сущности
│   ├── user.ts                  # User (Plain/Encrypted/Hashed Entity)
│   ├── group.ts                 # Group Entity
│   └── groupsUsers.ts           # GroupsUsers Entity
├── pkg/                         # Инфраструктура
│   ├── dbTransaction.ts         # Сервис транзакций
│   ├── errors.ts                # Бизнес-ошибки
│   ├── generators.ts            # Генераторы (OTP коды)
│   ├── logger.ts                # Pino logger
│   ├── postgres.ts              # PostgreSQL подключение
│   ├── redis.ts                 # Redis подключение
│   ├── sql.ts                   # SQL утилиты
│   └── times.ts                 # Тайм-утилиты
├── repositories/
│   ├── db/                      # Репозитории БД (users, groups, groupsUsers)
│   └── stores/                  # Хранилища (otpCodes, refreshTokens)
├── services/                    # Бизнес-логика
│   ├── crypto/                  # Шифрование (AES)
│   ├── groups/                  # Groups сервис
│   ├── groupsUsers/             # GroupsUsers сервис
│   ├── jwt/                     # JWT сервис
│   ├── rateLimiter/             # Rate limiting сервис
│   └── users/                   # Users сервис (encryption, hashing)
└── useCases/                    # Сценарии использования
    ├── auth/                    # Auth сценарии (login, registration, forgotPassword)
    ├── groups/                  # Groups сценарии (CRUD, invite, exclude)
    └── me/                      # Me сценарии (getMe)
```

## Архитектурные принципы
- **Чистая архитектура**: зависимости направлены внутрь (useCases → services → repositories)
- **DI (Dependency Injection)**: сервисы и репозитории инжектятся через конструктор
- **Транзакции**: `DbTransactionService` для атомарных операций (useCases не зависит от репозиториев)
- **Entity pattern**: сущности инкапсулируют данные через `#private` поля
- **Data separation**: разделение на Plain/Encrypted/Hashed сущности для безопасности

## Доменная модель

### User
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `encryptionSalt` | UUID | Соль для шифрования |
| `personalInfoEncrypted` | `UserPersonalInfoEncryptedEntity` | Зашифрованные ФИО |
| `contactsEncrypted` | `UserContactsEncryptedEntity` | Зашифрованные контакты |
| `contactsHashed` | `UserContactsHashedEntity` | Хешированные контакты (для поиска) |
| `passwordHashed` | `UserPasswordHashedEntity` | Хешированный пароль (argon2) |

**Сущности:**
- `UserEntity` — полная сущность с зашифрованными данными
- `UserPlainEntity` — сущность с расшифрованными данными
- `UserCreatePlainEntity` — данные для создания пользователя
- `UserFindOnePlainEntity` — параметры поиска пользователя
- `UserPatchOnePlainEntity` — данные для обновления пользователя

### Group
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `name` | VARCHAR(50) | Название группы |
| `description` | VARCHAR(1000) | Описание (опционально) |
| `createdAt` | TIMESTAMP | Дата создания |

### GroupsUsers
| Поле | Тип | Описание |
|------|-----|----------|
| `group_id` | UUID | FK на groups (CASCADE DELETE) |
| `user_id` | UUID | FK на users (CASCADE DELETE) |
| `is_owner` | BOOLEAN | Флаг владельца |
| `createdAt` | TIMESTAMP | Дата добавления |

**Индексы:**
- `PRIMARY KEY (group_id, user_id)`
- `UNIQUE INDEX uniq_group_owner ON (group_id) WHERE is_owner = TRUE` — только один владелец на группу

## Важные детали реализации

### DbTransactionService
Отдельный сервис для управления транзакциями. UseCase зависит от интерфейса `IDbTransactionService`, а не от репозитория:
```typescript
// pkg/dbTransaction.ts
export interface IDbTransactionService {
  executeInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}

// useCases/groups/groups.ts
return this.#transactionService.executeInTransaction(async (client) => {
  await this.#groupsService.createOne(entity, { client });
  await this.#groupsUsersService.createOne(entity, { client });
});
```
При ошибке любой операции — автоматический `ROLLBACK`.

### Поддержка транзакций в сервисах
Все методы сервисов и репозиториев принимают опциональный параметр:
```typescript
createOne(entity: Entity, options?: { client?: PoolClient }): Promise<Result>
```
Если `client` не передан — используется обычный `pool.query()`.

### Шифрование данных
- **AES шифрование**: персональные данные (имя, фамилия, email, телефон)
- **HMAC хеширование**: для поиска по контактам (email/phone)
- **Argon2**: хеширование паролей
- **Соль**: уникальный `encryptionSalt` на каждого пользователя

### Фильтрация в findMany
```typescript
groupsService.findMany(new GroupFindManyEntity({
    ids: [id1, id2],  // WHERE id IN (...)
    name: 'Ивановы'   // WHERE name ILIKE '%Ивановы%'
}))
```

## API (порт 8000)

### `/api/auth/*` — Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/login` | Вход (email + password) |
| POST | `/registration/start` | Начало регистрации (отправка OTP) |
| POST | `/registration/end` | Завершение регистрации (проверка OTP) |
| POST | `/forgot-password/start` | Начало восстановления пароля |
| POST | `/forgot-password/end` | Завершение восстановления пароля |
| POST | `/refresh` | Обновление токенов |
| GET | `/sessions` | Получить все сессии |
| POST | `/logout` | Выход из текущей сессии |
| POST | `/logout-all` | Выход из всех сессий |

### `/api/groups/*` — Группы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/` | Список групп пользователя |
| POST | `/` | Создать группу |
| GET | `/:groupId` | Получить группу |
| PATCH | `/:groupId` | Обновить группу (только владелец) |
| DELETE | `/:groupId` | Удалить группу (только владелец, если нет других пользователей) |
| POST | `/:groupId/inviteUser` | Пригласить пользователя (только владелец, проверка лимита пользователей) |
| POST | `/:groupId/excludeUser` | Исключить пользователя (только владелец) |

### `/api/me/*` — Профиль
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/` | Получить профиль текущего пользователя |

## Аутентификация и авторизация

### JWT токены
| Токен | Время жизни | Где хранится |
|-------|-------------|--------------|
| Access | 5 минут | Authorization header (`Bearer <token>`) |
| Refresh | 30 дней | HttpOnly cookie (`refreshToken`) |

### Middleware
- `AuthMiddleware` — проверяет access токен, добавляет `userId` в request
- Rate limiting — на контакты (email/phone) для защиты от brute-force

## Безопасность

### Группы
- Только владелец группы может:
  - Редактировать группу (PATCH)
  - Удалять группу (DELETE)
  - Приглашать пользователей (POST /inviteUser) — с проверкой лимита `maxUsers`
  - Исключать пользователей (POST /excludeUser)
- Владелец **не может** исключить себя из группы
- Удаление группы возможно **только если в ней нет других пользователей**
- Проверка существования группы: если пользователь не в группе → `ErrorGroupNotExists` (не раскрывает существование)

### Пользователи
- Персональные данные зашифрованы (AES)
- Контакты хешированы (HMAC) для поиска
- Пароли хешированы (Argon2)
- OTP коды для регистрации и восстановления пароля
- Rate limiting на запросы

## Лимиты
| Лимит | Значение |
|-------|----------|
| Макс. групп на пользователя | 3 |
| Макс. пользователей в группе | 2 (настраивается) |

## Бизнес-ошибки

### Аутентификация
| Ошибка | HTTP | Описание |
|--------|------|----------|
| `ErrorInvalidCode` | 400 | Неверный OTP код |
| `ErrorInvalidContacts` | 400 | Неверные контакты (email/phone) |
| `ErrorUserExists` | 400 | Пользователь уже существует |
| `ErrorUserNotExists` | 400 | Пользователь не существует |
| `ErrorInvalidLoginOrPassword` | 400 | Неверный логин или пароль |
| `ErrorUnauthorized` | 401 | Не авторизован |
| `ErrorTokenExpired` | 401 | Токен истёк |
| `ErrorDoubleRegistration` | 429 | Двойная регистрация (одновременно) |
| `ErrorTooManyRequests` | 429 | Превышен лимит запросов |
| `ErrorInvalidUserAgent` | 400 | Неверный User-Agent |

### Группы
| Ошибка | HTTP | Описание |
|--------|------|----------|
| `ErrorGroupNotExists` | 404 | Группа не найдена или пользователь не в группе |
| `ErrorUserIsNotGroupOwner` | 400 | Пользователь не владелец группы |
| `ErrorUserIsGroupOwner` | 400 | Владелец не может исключить себя |
| `ErrorUserInGroup` | 400 | Пользователь уже в группе / В группе есть пользователи |
| `ErrorUserNotInGroup` | 400 | Пользователь не в группе |
| `ErrorGroupHasUsers` | 400 | Нельзя удалить группу — есть другие пользователи |
| `ErrorGroupsLimitExceeded` | 403 | Превышен лимит групп на пользователя |
| `ErrorGroupUsersCountLimitExceeded` | 403 | Превышен лимит пользователей в группе |

## Конфигурация

### Переменные окружения (config/env.yaml)
```yaml
nodeEnv: local|development|production
server:
  port: 8000
postgres:
  uri: postgresql://root:root@localhost:5432/postgres
redis:
  uri: redis://default:root@localhost:6379
ttls:
  registrationSec: 600
  forgotPasswordSec: 600
codesLength:
  registration: 6
  forgotPassword: 6
salts:
  hashCredentials: <16+ символов>
  cryptoCredentials: <1+ символов>
jwt:
  accessTokenSecret: <secret>
  refreshTokenSecret: <secret>
  accessTokenExpiry: 300000  # 5 мин
  refreshTokenExpiry: 2592000000  # 30 дней
  issuer: <issuer>
cookie:
  secret: <secret>
limits:
  user:
    maxGroups: 3
  group:
    maxUsers: 2
```

## Миграции
1. **users** — пользователи (encrypted email/phone, hashed password, HMAC для поиска)
2. **groups** — группы (name, description)
3. **groups_users** — связь пользователей с группами (уникальный индекс на владельца)

## Команды
```bash
npm run dev              # Запуск в режиме разработки (nodemon)
npm run build            # Сборка TypeScript
npm run migrations:up    # Применить миграции
npm run migrations:create # Создать миграцию
```

## Запуск (Docker)
```bash
docker-compose up -d postgres redis
npm run migrations:up
npm run dev
```

## Swagger
В режиме разработки (`local`, `development`) доступен Swagger UI по адресу `/documentation`.
