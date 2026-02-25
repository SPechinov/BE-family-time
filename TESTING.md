# Тестирование BE-family-time

## Обзор

Проект использует **Jest 30.2.x** для интеграционного тестирования API. Тесты работают с реальной базой данных PostgreSQL и Redis, обеспечивая полное покрытие бизнес-логики.

## Архитектура тестов

```
src/tests/
├── integration/          # Интеграционные тесты API
│   ├── auth.test.ts      # Тесты авторизации и регистрации
│   ├── me.test.ts        # Тесты профиля пользователя
│   └── groups.test.ts    # Тесты управления группами
├── fixtures/             # Фабрики тестовых данных
│   └── user.fixture.ts   # Генерация пользователей и групп
├── utils/                # Утилиты для тестов
│   ├── test-db.ts        # Управление PostgreSQL
│   ├── test-redis.ts     # Управление Redis
│   ├── test-setup.ts     # Setup/teardown окружения
│   └── test-http.ts      # HTTP клиенты и хелперы
├── mocks/                # Моки для внешних зависимостей
├── setup.ts              # Глобальный setup/teardown
└── jest-setup.ts         # Per-test setup
```

## Требования

### Локальный запуск

Для запуска тестов необходимы:

1. **PostgreSQL 16.3** на порту `5432` (или кастомный порт через `TEST_DB_PORT`)
2. **Redis 7.4** на порту `6379` (или кастомный порт через `TEST_REDIS_PORT`)

### Использование Docker (рекомендуется)

```bash
# Запуск БД и Redis через docker-compose
docker-compose up -d postgres redis

# Проверка статуса
docker-compose ps
```

## Запуск тестов

### Базовые команды

```bash
# Запустить все тесты
npm run test

# Запустить все интеграционные тесты
npm run test:integration

# Запуск в режиме watch (автоматический перезапуск при изменениях)
npm run test:integration:watch

# Запуск с покрытием кода (coverage)
npm run test:coverage
```

### Запуск отдельных модулей

```bash
# Тесты авторизации
npm run test:auth

# Тесты профиля пользователя
npm run test:me

# Тесты управления группами
npm run test:groups
```

### Запуск с кастомной конфигурацией БД

```bash
# Использование альтернативной БД
TEST_DB_PORT=5433 TEST_DB_NAME=test_db npm run test:integration

# Использование альтернативного Redis
TEST_REDIS_PORT=6380 npm run test:integration
```

## Структура тестов

### Auth API (`auth.test.ts`)

Покрытые endpoints:

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/auth/registration-start` | POST | Начало регистрации (отправка OTP) |
| `/api/auth/registration-end` | POST | Завершение регистрации |
| `/api/auth/login` | POST | Вход в систему |
| `/api/auth/forgot-password-start` | POST | Начало восстановления пароля |
| `/api/auth/forgot-password-end` | POST | Завершение восстановления пароля |
| `/api/auth/get-all-sessions` | GET | Получение активных сессий |
| `/api/auth/logout-session` | POST | Завершение текущей сессии |
| `/api/auth/logout-all-sessions` | POST | Завершение всех сессий |
| `/api/auth/refresh-tokens` | POST | Обновление JWT токенов |

**Проверки безопасности:**
- Валидация JWT токенов
- Rate limiting на критических endpoints
- Обработка невалидных данных
- Защита от enumeration (возврат 200 для несуществующих пользователей)

### Me API (`me.test.ts`)

Покрытые endpoints:

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/me` | GET | Получение профиля текущего пользователя |

**Проверки:**
- Валидация структуры ответа (Zod схемы)
- Проверка прав доступа (требуется JWT)
- Обработка различных User-Agent

### Groups API (`groups.test.ts`)

Покрытые endpoints:

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/groups` | POST | Создание группы |
| `/api/groups` | GET | Список групп пользователя |
| `/api/groups/:groupId` | GET | Получение информации о группе |
| `/api/groups/:groupId` | PATCH | Обновление группы |
| `/api/groups/:groupId` | DELETE | Удаление группы |
| `/api/groups/:groupId/inviteUser` | POST | Приглашение пользователя |
| `/api/groups/:groupId/excludeUser` | POST | Исключение пользователя |

**Проверки:**
- Права владельца группы
- Изоляция между группами
- Каскадное удаление связанных данных
- Валидация UUID

## Фикстуры и фабрики

### Генерация пользователей

```typescript
import { createUserFixture, createMultipleUsers } from '@/tests/fixtures';

// Один пользователь
const user = createUserFixture();
// { email: '...', password: 'TestPassword123!', firstName: '...', lastName: '...' }

// Пользователь с кастомными данными
const user = createUserFixture({ email: 'custom@example.com' });

// Несколько пользователей
const users = createMultipleUsers(5);
```

### Генерация групп

```typescript
import { createGroupFixture, createMultipleGroups } from '@/tests/fixtures';

// Одна группа
const group = createGroupFixture();
// { name: '...', description: '...' }

// Группа без описания
const group = createGroupFixture({ description: undefined });
```

### User-Agent строки

```typescript
import { USER_AGENTS } from '@/tests/fixtures';

// Предопределённые User-Agent
USER_AGENTS.chrome;
USER_AGENTS.firefox;
USER_AGENTS.safari;
USER_AGENTS.mobile;
```

## Утилиты

### HTTP запросы

```typescript
import { 
  createTestAgent, 
  DEFAULT_HEADERS, 
  createAuthHeaders,
  extractAuthToken,
  extractCookie 
} from '@/tests/utils/test-http';

// Создание test agent
const request = createTestAgent(fastifyInstance);

// Запрос с авторизацией
const response = await request
  .get('/api/me')
  .set(createAuthHeaders(jwtToken));

// Извлечение токена из ответа
const authToken = extractAuthToken(response);

// Извлечение cookie
const refreshToken = extractCookie(response, 'refreshToken');
```

### Работа с БД

```typescript
import { truncateAllTables, runMigrations } from '@/tests/utils/test-db';

// Очистка всех таблиц
await truncateAllTables(pool);

// Запуск миграций
await runMigrations(pool);
```

## Изоляция тестов

Каждый тест работает с чистым состоянием:

1. **BeforeAll**: Подключение к БД/Redis, запуск миграций, старт Fastify
2. **BeforeEach**: Очистка всех таблиц (TRUNCATE), flush Redis
3. **AfterAll**: Закрытие соединений

```typescript
// В каждом тестовом файле
beforeAll(async () => {
  const context = globalThis.__TEST_CONTEXT__;
  request = createTestAgent(context.fastify);
});

// Очистка выполняется автоматически через jest-setup.ts
```

## Параллельный запуск

Jest автоматически распараллеливает тесты. Для корректной работы:

1. Каждый тест очищает данные после выполнения
2. Тесты не зависят от состояния других тестов
3. Используется один общий пул подключений к БД

## Покрытие кода

Для генерации отчёта о покрытии:

```bash
npm run test:coverage
```

Отчёт будет доступен в `coverage/`:
- `coverage/lcov-report/index.html` - HTML версия
- `coverage/coverage-summary.json` - JSON сводка

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16.3
        env:
          POSTGRES_DB: postgres
          POSTGRES_USER: root
          POSTGRES_PASSWORD: root
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7.4.0
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run migrations:up
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Отладка тестов

### Логирование

```bash
# Запуск с подробным выводом
npm run test -- --verbose

# Запуск конкретного теста
npm run test -- --testNamePattern="should login with valid credentials"

# Запуск с выводом логов Jest
npm run test -- --debug
```

### VS Code отладка

Создайте `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": [
        "--runInBand",
        "${relativeFile}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticOrphanTermination": true
    }
  ]
}
```

## Частые проблемы

### "Test context not initialized"

Убедитесь, что `globalSetup` и `globalTeardown` настроены в `jest.config.js`:

```javascript
export default {
  globalSetup: '<rootDir>/src/tests/setup.ts',
  globalTeardown: '<rootDir>/src/tests/setup.ts',
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest-setup.ts'],
};
```

### "Connection refused" к БД/Redis

Проверьте, что сервисы запущены:

```bash
docker-compose ps
```

Или используйте кастомные порты:

```bash
TEST_DB_PORT=5433 TEST_REDIS_PORT=6380 npm run test
```

### Таймауты тестов

Увеличьте таймаут в `jest.config.js`:

```javascript
export default {
  testTimeout: 30000, // 30 секунд
};
```

## Best Practices

1. **Не используйте `describe.only` или `it.skip` в коммитах**
2. **Очищайте данные после каждого теста** (автоматически через setup)
3. **Используйте фабрики для генерации данных** вместо хардкода
4. **Проверяйте не только статус код, но и тело ответа**
5. **Тестируйте edge cases**: пустые строки, null, undefined, граничные значения
6. **Добавляйте тесты на безопасность**: инъекции, XSS, JWT манипуляции

## Расширение тестов

Для добавления новых тестов:

1. Создайте файл `src/tests/integration/<module>.test.ts`
2. Импортируйте утилиты из `@/tests/utils`
3. Используйте фабрики из `@/tests/fixtures`
4. Следуйте структуре существующих тестов

Пример шаблона:

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { SuperTest, Test } from 'supertest';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { createTestAgent, DEFAULT_HEADERS } from '@/tests/utils/test-http';
import { createUserFixture } from '@/tests/fixtures';

declare global {
  var __TEST_CONTEXT__: {
    fastify: any;
    postgres: Pool;
    redis: RedisClientType;
  } | null;
}

describe('<Module> API Integration Tests', () => {
  let request: SuperTest<Test>;
  
  beforeAll(async () => {
    const context = globalThis.__TEST_CONTEXT__;
    request = createTestAgent(context.fastify);
  });

  describe('POST /endpoint', () => {
    it('should work correctly', async () => {
      const response = await request
        .post('/api/endpoint')
        .set(DEFAULT_HEADERS);
      
      expect(response.status).toBe(200);
    });
  });
});
```
