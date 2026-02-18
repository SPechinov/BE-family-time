# API Tests - Family Time Backend

## 📋 Описание

Интеграционные тесты для REST API Family Time. Тесты проверяют работу всех эндпоинтов через реальное взаимодействие с приложением.

## 🚀 Быстрый старт

### Предварительные требования

1. **Запущенные сервисы:**
   - PostgreSQL (порт 5432)
   - Redis (порт 6379)

2. **Запущенное приложение:**
   ```bash
   npm run dev
   ```

### Запуск тестов

```bash
# Запустить все API тесты
npm run test:api

# Запустить конкретный тестовый файл
npx jest src/tests/api/auth.test.ts

# Запустить с покрытием
npx jest src/tests/api --coverage

# Запустить в watch режиме
npx jest src/tests/api --watch
```

## 📁 Структура тестов

```
src/tests/api/
├── helpers.ts          # Утилиты и хелперы для тестов
├── auth.test.ts        # Тесты авторизации/регистрации
└── me.test.ts          # Тесты профиля пользователя
```

## 🔧 Хелперы

### `setupTestServer()`
Инициализирует тестовый сервер с подключением к БД и Redis.

### `teardownTestServer()`
Очищает ресурсы после тестов.

### `cleanDatabase()`
Очищает базу данных перед каждым тестом.

### `api.*`
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

### `testData.*`
Генераторы тестовых данных:

```typescript
testData.generateEmail()        // test-{uuid}@test.com
testData.generatePassword()     // TestPassword123!@#
testData.generateFirstName()    // TestUser-{uuid}
testData.generateUserAgent()    // TestAgent/1.0 ({uuid})
```

### `completeRegistrationFlow()`
Полный поток регистрации + вход:

```typescript
const { email, password, firstName, tokens } = await completeRegistrationFlow({ userAgent });
```

## 📊 Покрытые эндпоинты

### Auth

| Метод | Endpoint | Описание | Тестов |
|-------|----------|----------|--------|
| POST | `/api/auth/registration-start` | Начало регистрации | 6 |
| POST | `/api/auth/registration-end` | Завершение регистрации | 8 |
| POST | `/api/auth/login` | Вход | 7 |
| POST | `/api/auth/forgot-password-start` | Начало восстановления пароля | 3 |
| POST | `/api/auth/forgot-password-end` | Завершение восстановления пароля | 3 |
| POST | `/api/auth/refresh-tokens` | Обновление токенов | 4 |
| GET | `/api/auth/get-all-sessions` | Получить все сессии | 4 |
| POST | `/api/auth/logout-session` | Выход из текущей сессии | 1 |
| POST | `/api/auth/logout-all-sessions` | Выход из всех сессий | 2 |

### Me

| Метод | Endpoint | Описание | Тестов |
|-------|----------|----------|--------|
| GET | `/api/me` | Получить профиль пользователя | 10 |

**Всего: 48 тестов**

## 🎯 Категории тестов

### ✓ Success cases
Проверка успешных сценариев использования.

### ✗ Validation errors
Проверка валидации входных данных.

### 🔐 Security
Проверки безопасности:
- Отсутствие user-agent
- Недоступность чувствительных данных
- Предотвращение двойной регистрации
- Инвалидация токенов

### ⚡ Performance
Проверки производительности:
- Время ответа < 100ms
- Обработка параллельных запросов

### Integration
Полные пользовательские сценарии:
- Регистрация → Вход → Профиль → Выход
- Восстановление пароля
- Управление множественными сессиями

## 📝 Примеры тестов

### Полный тест регистрации и входа

```typescript
import { api, testData } from './helpers';

it('should complete registration and login', async () => {
  const email = testData.generateEmail();
  const password = testData.generatePassword();
  const firstName = testData.generateFirstName();
  const userAgent = testData.generateUserAgent();

  // Start registration
  const { otpCode } = await api.registrationStart({ email, userAgent });

  // Complete registration
  await api.registrationEnd({
    email,
    password,
    firstName,
    otpCode,
    userAgent,
  });

  // Login
  const { tokens } = await api.login({ email, password, userAgent });

  // Verify tokens
  expect(tokens.accessToken).toBeDefined();
  expect(tokens.refreshToken).toBeDefined();
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
  expect(user.id).toBeDefined();
});
```

## 🔍 Отладка

### Логирование
Тесты используют silent logger для чистоты вывода. Для отладки:

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
```

## ⚠️ Важные замечания

1. **Изоляция тестов**: Каждый тест очищает базу данных в `beforeEach`
2. **OTP коды**: В dev режиме OTP коды возвращаются в заголовке `X-Dev-Otp-Code`
3. **Токены**: Access токен передаётся в заголовке `Authorization`, refresh токен в cookie
4. **User-Agent**: Обязательный заголовок для всех запросов

## 📈 Покрытие

Для проверки покрытия:

```bash
npm run test:api -- --coverage
```

Отчёт будет в папке `coverage/`.

## 🐛 Troubleshooting

### Ошибка: "Cannot connect to Redis"
Убедитесь, что Redis запущен:
```bash
docker-compose up -d redis
```

### Ошибка: "Cannot connect to PostgreSQL"
Убедитесь, что PostgreSQL запущен и миграции применены:
```bash
docker-compose up -d postgres
npm run migrations:up
```

### Тесты падают с "401 Unauthorized"
Проверьте, что передаёте правильный access token в заголовке `Authorization`.

### OTP код не возвращается
Убедитесь, что приложение запущено в режиме `local` или `development`. В production режиме OTP коды не возвращаются.
