# Tests — Family Time Backend

Тесты для backend-сервиса Family Time.

## 📁 Структура

```
src/tests/
├── index.ts              # Главный экспорт тестовой инфраструктуры
├── api/                  # API интеграционные тесты
│   ├── helpers.ts        # API клиент и утилиты
│   ├── auth.test.ts      # Тесты авторизации
│   └── me.test.ts        # Тесты профиля пользователя
├── unit/                 # Модульные тесты
│   ├── services/         # Тесты сервисов
│   │   ├── crypto/       # Криптографические сервисы
│   │   ├── jwt/          # JWT сервис
│   │   ├── rateLimiter/  # Rate limiting
│   │   └── users/        # Сервис пользователей
│   ├── repositories/     # Тесты репозиториев
│   │   ├── users/
│   │   ├── groups/
│   │   └── groupsUsers/
│   ├── entities/         # Тесты сущностей
│   └── useCases/         # Тесты use cases
├── integration/          # Интеграционные тесты
├── e2e/                  # End-to-end тесты
├── fixtures/             # Тестовые данные и фабрики
│   ├── index.ts
│   ├── test-data.ts      # Генераторы тестовых данных
│   └── user-fixture.ts   # Фабрики пользователей
├── helpers/              # Утилиты для тестов
│   └── index.ts
├── mocks/                # Моки для внешних зависимостей
│   ├── index.ts
│   └── nanoid.ts         # Mock для nanoid
└── README.md
```

## 🚀 Команды

```bash
# Все тесты
npm test

# Unit-тесты
npm run test:unit                    # Все unit-тесты
npm run test:unit:services           # Только сервисы
npm run test:unit:repositories       # Только репозитории

# Integration тесты
npm run test:integration

# API тесты (требуют БД и Redis)
npm run test:api

# E2E тесты
npm run test:e2e

# Watch режим
npm run test:watch

# С покрытием
npm run test:coverage
```

## 📊 Типы тестов

| Тип | Расположение | Требует БД/Redis | Описание |
|-----|-------------|------------------|----------|
| **Unit** | `unit/` | ❌ | Изолированные тесты компонентов |
| **Integration** | `integration/` | ✅ | Тесты взаимодействия между слоями |
| **API** | `api/` | ✅ | HTTP-эндпоинты через fastify.inject() |
| **E2E** | `e2e/` | ✅ | Полные пользовательские сценарии |

## 📝 Быстрый старт

### Написание нового теста

```typescript
// src/tests/unit/services/myService/myService.test.ts
import { MyService } from '@/services/myService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  describe('methodName()', () => {
    it('should do something', async () => {
      const result = await service.methodName();
      expect(result).toBeDefined();
    });
  });
});
```

### API тесты

```typescript
// src/tests/api/myFeature.test.ts
import { api, testData, completeRegistrationFlow } from './helpers';

describe('My Feature API', () => {
  const userAgent = testData.generateUserAgent();

  beforeAll(async () => {
    await setupTestServer();
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should work', async () => {
    const { tokens } = await completeRegistrationFlow({ userAgent });
    
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/api/my-endpoint',
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

### Использование фикстур

```typescript
import { testData, createUserFixture } from '@/tests';

// Генерация данных
const email = testData.generateEmail();
const password = testData.generatePassword();

// Создание пользователя
const user = await createUserFixture({
  email,
  password,
});
```

## 🔧 Конфигурация

Jest настроен в `jest.config.js`:
- ESM поддержка
- Path aliases (`@/` → `src/`)
- TypeScript через ts-jest
- Моки для внешних зависимостей

## 📦 Моки

### nanoid
Автоматически мокируется через `src/tests/mocks/nanoid.ts`

### Создание моков
```typescript
jest.mock('@/services/external', () => ({
  externalFunction: jest.fn().mockReturnValue('mocked'),
}));
```

## 📚 Документация по категориям

- [Unit тесты](unit/README.md)
- [API тесты](api/README.md)
- [Фикстуры](fixtures/README.md)

## 🎯 Best Practices

### Организация тестов
- **Один файл — один тестируемый компонент**
- **Describe блоки** для группировки по функциональности
- **Имена тестов** должны описывать ожидаемое поведение

### Naming Convention
```typescript
describe('ServiceName', () => {
  describe('methodName()', () => {
    describe('✓ Valid operations', () => {
      it('should return expected value', () => {});
    });

    describe('✗ Invalid input', () => {
      it('should throw error', () => {});
    });

    describe('🔐 Security', () => {
      it('should reject unauthorized access', () => {});
    });
  });
});
```

### Общие принципы
1. **Изоляция** — каждый тест независим
2. **Повторяемость** — тесты дают одинаковый результат
3. **Скорость** — unit тесты должны быть быстрыми
4. **Читаемость** — имена тестов описывают поведение
