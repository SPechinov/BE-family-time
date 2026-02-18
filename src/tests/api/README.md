# API Tests - Family Time Backend

## 📋 Описание

Интеграционные тесты для REST API Family Time. Тесты проверяют работу всех эндпоинтов через реальное взаимодействие с приложением.

Тесты используют **in-memory** подход с `fastify.inject()` — сервер не занимает порт, все запросы симулируются внутри процесса.

## 🚀 Быстрый старт

### Предварительные требования

1. **Запущенные сервисы:**
   - PostgreSQL (порт 5432)
   - Redis (порт 6379)

```bash
# Запустить сервисы через Docker
docker-compose up -d postgres redis
```

2. **Применить миграции:**
```bash
npm run migrations:up
```

> ⚠️ **Приложение запускать не нужно!** Тесты создают изолированный инстанс сервера.

### Запуск тестов

```bash
# Запустить все API тесты
npm run test:api

# Запустить конкретный тестовый файл
npx jest src/tests/api/auth.test.ts

# Запустить конкретный тест по имени
npx jest src/tests/api/auth.test.ts -t "should login with valid credentials"

# Запустить с покрытием
npm run test:api -- --coverage

# Запустить в watch режиме (для разработки)
npm run test:api -- --watch
```

> 💡 Тесты запускаются с флагом `--runInBand` для последовательного выполнения (общее состояние БД/Redis).

## 📁 Структура тестов

```
src/tests/api/
├── helpers.ts          # Утилиты и хелперы для тестов
├── __mocks__/          # Моки для внешних зависимостей
│   └── nanoid.ts       # Mock для nanoid (ES модуль)
├── auth.test.ts        # Тесты авторизации/регистрации (35 тестов)
└── me.test.ts          # Тесты профиля пользователя (14 тестов)
```

## 🔧 Хелперы

### Сервер

| Функция | Описание |
|---------|----------|
| `setupTestServer()` | Инициализирует тестовый сервер с БД и Redis |
| `teardownTestServer()` | Очищает ресурсы после всех тестов |
| `cleanDatabase()` | Очищает БД и Redis перед каждым тестом |

### API Client

Готовые функции для вызова API:

```typescript
// Регистрация
const { otpCode } = await api.registrationStart({ email, userAgent });
await api.registrationEnd({ email, password, firstName, otpCode, userAgent });

// Вход
const { tokens } = await api.login({ email, password, userAgent });

// Получение профиля
const { user } = await api.getMe({ accessToken, userAgent });

// Выход
await api.logoutSession({ accessToken, userAgent });
await api.logoutAllSessions({ accessToken, userAgent });

// Обновление токенов
const { tokens } = await api.refreshTokens({ refreshToken, userAgent });

// Сессии
const { sessions } = await api.getAllSessions({ accessToken, userAgent });

// Восстановление пароля
const { otpCode } = await api.forgotPasswordStart({ email, userAgent });
await api.forgotPasswordEnd({ email, password, otpCode, userAgent });
```

> 💡 Все методы возвращают `{ response, ...data }`, где `response` — полный ответ Fastify.

### TestData

Генераторы тестовых данных:

```typescript
testData.generateEmail()        // test-{uuid}@test.com
testData.generatePassword()     // TestPassword123!@#
testData.generateFirstName()    // TestUser-{uuid}
testData.generateUserAgent()    // TestAgent/1.0 ({uuid})
```

### CompleteRegistrationFlow

Полный поток регистрации + вход:

```typescript
const { email, password, tokens } = await completeRegistrationFlow({ userAgent });
```

Возвращает:
- `email`, `password` — учётные данные
- `tokens.accessToken` — JWT токен (с префиксом `Bearer`)
- `tokens.refreshToken` — Refresh токен (в cookie)

## 📊 Покрытые эндпоинты

### Auth

| Метод | Endpoint | Тестов | Статусы |
|-------|----------|--------|---------|
| POST | `/api/auth/registration-start` | 6 | 200, 422 |
| POST | `/api/auth/registration-end` | 8 | 201, 400, 422 |
| POST | `/api/auth/login` | 7 | 200, 400, 422 |
| POST | `/api/auth/forgot-password-start` | 3 | 200, 422 |
| POST | `/api/auth/forgot-password-end` | 3 | 200, 400, 422 |
| POST | `/api/auth/refresh-tokens` | 4 | 200, 401 |
| GET | `/api/auth/get-all-sessions` | 4 | 200, 401 |
| POST | `/api/auth/logout-session` | 1 | 200 |
| POST | `/api/auth/logout-all-sessions` | 2 | 200 |

### Me

| Метод | Endpoint | Тестов | Статусы |
|-------|----------|--------|---------|
| GET | `/api/me` | 14 | 200, 401 |

**Всего: 49 тестов**

## 🎯 Категории тестов

| Категория | Префикс | Описание |
|-----------|---------|----------|
| ✓ Success | `✓ Success cases` | Проверка успешных сценариев |
| ✗ Validation | `✗ Validation errors` | Проверка валидации (422) |
| 🔐 Security | `🔐 Security` | Проверки безопасности |
| ⚡ Performance | `⚡ Performance` | Проверки производительности |
| Integration | `Integration` | Полные пользовательские сценарии |

### Примеры проверок

**Security:**
- Отсутствие user-agent (не валидируется на уровне схемы)
- Недоступность чувствительных данных (password, hash)
- Инвалидация refresh токенов

**Performance:**
- Время ответа < 100ms
- Обработка 10 параллельных запросов

**Integration:**
- Регистрация → Вход → Профиль → Выход
- Восстановление пароля
- Управление множественными сессиями

## 📝 Примеры тестов

### Базовый тест

```typescript
import { api, testData } from './helpers';

it('should complete registration and login', async () => {
  const email = testData.generateEmail();
  const password = testData.generatePassword();
  const firstName = testData.generateFirstName();
  const userAgent = testData.generateUserAgent();

  // Start registration
  const { otpCode } = await api.registrationStart({ email, userAgent });
  expect(otpCode).toHaveLength(6);

  // Complete registration
  const { response } = await api.registrationEnd({
    email,
    password,
    firstName,
    otpCode,
    userAgent,
  });
  expect(response.statusCode).toBe(201);

  // Login
  const { tokens } = await api.login({ email, password, userAgent });
  expect(tokens.accessToken).toBeDefined();
});
```

### Тест с полным потоком

```typescript
import { completeRegistrationFlow, api } from './helpers';

it('should get user profile', async () => {
  const { tokens } = await completeRegistrationFlow({ userAgent });

  const { user } = await api.getMe({
    accessToken: tokens.accessToken,
    userAgent,
  });

  expect(user.email).toBeDefined();
  expect(user.firstName).toBeDefined();
});
```

### Тест с несколькими сессиями

```typescript
it('should handle multiple sessions', async () => {
  const { email, password, tokens } = await completeRegistrationFlow({ userAgent });

  // Login с разных "устройств"
  const { tokens: device2 } = await api.login({
    email,
    password,
    userAgent: 'Device2/1.0',
  });

  // Проверка сессий
  const { sessions } = await api.getAllSessions({
    accessToken: tokens.accessToken,
    userAgent,
  });
  expect(sessions.length).toBeGreaterThan(1);
});
```

## 🔍 Отладка

### Логирование

Тесты используют `silent` logger. Для отладки измените в `helpers.ts`:

```typescript
const logger = new Logger({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
  },
});
```

### Проверка ответов

```typescript
const { response } = await api.login({ email, password, userAgent });

console.log('Status:', response.statusCode);
console.log('Headers:', response.headers);
console.log('Body:', response.json());
console.log('Cookies:', response.cookies);
console.log('Tokens:', response.tokens);
```

### Запуск одного теста

```bash
# По имени теста
npx jest src/tests/api/auth.test.ts -t "should login"

# По файлу
npx jest src/tests/api/me.test.ts

# С вывод логов
npx jest src/tests/api/auth.test.ts --verbose
```

## ⚠️ Важные замечания

1. **Токены**: Access токен передаётся с префиксом `Bearer` в заголовке `Authorization`
2. **Refresh токен**: Возвращается в cookie `Set-Cookie: refreshToken=...`
3. **OTP коды**: В dev режиме возвращаются в заголовке `X-Dev-Otp-Code`
4. **Изоляция**: Каждый тест очищает БД и Redis в `beforeEach`
5. **Последовательность**: Тесты запускаются с `--runInBand` из-за общего состояния

## 📈 Покрытие

Для проверки покрытия:

```bash
npm run test:api -- --coverage
```

Отчёт будет в папке `coverage/`. Откройте `coverage/lcov-report/index.html` для просмотра.

## 🐛 Troubleshooting

### Ошибка: "Cannot connect to Redis"

```bash
# Проверить статус
docker-compose ps

# Перезапустить
docker-compose up -d redis
```

### Ошибка: "Cannot connect to PostgreSQL"

```bash
# Проверить статус
docker-compose ps

# Перезапустить и применить миграции
docker-compose up -d postgres
npm run migrations:up
```

### Тесты падают с "401 Unauthorized"

Проверьте формат токена:
```typescript
// ✅ Правильно
authorization: `Bearer ${tokens.accessToken}`

// ❌ Неправильно
authorization: tokens.accessToken
```

### Тесты падают с "500 Internal Server Error"

Возможные причины:
1. БД/Redis не очищены — запустите с `--runInBand`
2. Миграции не применены — `npm run migrations:up`
3. Конфликт сессий — используйте уникальный `userAgent`

### OTP код не возвращается

Убедитесь, что приложение в dev режиме. Проверьте заголовок:
```typescript
const { otpCode } = await api.registrationStart({ email, userAgent });
console.log(otpCode); // Должен быть 6-значный код
```

### Тесты работают по отдельности, но падают вместе

Это проблема состояния между тестами. Убедитесь:
1. Запущено с `--runInBand`
2. `cleanDatabase()` очищает и БД, и Redis
3. Каждый тест использует уникальные данные (`testData.generateEmail()`)
