# Unit Tests

Модульные тесты для изолированной проверки отдельных компонентов системы.

## 📁 Структура

```
unit/
├── services/          # Тесты сервисов
│   ├── crypto/       # Криптографические сервисы
│   │   ├── hashPassword/
│   │   ├── encryption/
│   │   └── hmac/
│   ├── jwt/          # JWT сервис
│   ├── rateLimiter/  # Rate limiting
│   └── users/        # Сервис пользователей
├── repositories/      # Тесты репозиториев
│   ├── users/
│   ├── groups/
│   └── groupsUsers/
├── entities/          # Тесты сущностей
└── useCases/          # Тесты use cases
```

## 🚀 Запуск

```bash
# Все unit-тесты
npm run test:unit

# Конкретная категория
npm run test:unit:services
npm run test:unit:repositories

# Конкретный файл
npx jest src/tests/unit/services/crypto/hashPassword/hashPassword.test.ts

# По имени теста
npx jest -t "should hash password correctly"
```

## 📝 Шаблон теста

```typescript
import { MyService } from '@/services/myService';

describe('MyService', () => {
  let service: MyService;

  beforeAll(async () => {
    // Инициализация перед всеми тестами
  });

  afterAll(async () => {
    // Очистка после всех тестов
  });

  beforeEach(() => {
    // Создание нового экземпляра перед каждым тестом
    service = new MyService();
  });

  describe('methodName()', () => {
    describe('✓ Valid operations', () => {
      it('should return expected value', async () => {
        const result = await service.methodName('input');
        expect(result).toBe('expected');
      });

      it('should handle edge case', async () => {
        const result = await service.methodName('');
        expect(result).toBeDefined();
      });
    });

    describe('✗ Invalid input', () => {
      it('should throw error for invalid input', async () => {
        await expect(service.methodName(null as any))
          .rejects.toThrow('Invalid input');
      });
    });

    describe('🔐 Security', () => {
      it('should reject unauthorized access', async () => {
        // Тест безопасности
      });
    });
  });
});
```

## 🔧 Мокирование

### Mock внешних зависимостей

```typescript
jest.mock('jsonwebtoken');
jest.mock('@/config', () => ({
  CONFIG: {
    jwt: {
      secret: 'test-secret',
      expiry: 3600,
    },
  },
}));
```

### Mock функций

```typescript
const mockFn = jest.fn().mockReturnValue('mocked');
const mockAsyncFn = jest.fn().mockResolvedValue({ data: 'mocked' });
const mockRejectFn = jest.fn().mockRejectedValue(new Error('error'));
```

### Spy

```typescript
const spy = jest.spyOn(service, 'methodName');
spy.mockReturnValue('mocked');
spy.mockRestore(); // Восстановить оригинальную функцию
```

## 📦 Категории тестов

### Services

Тесты бизнес-сервисов с мокированными зависимостями:

- **crypto** — хеширование, шифрование, HMAC
- **jwt** — генерация и валидация токенов
- **rateLimiter** — ограничение запросов
- **users** — логика работы с пользователями

```typescript
// Пример: crypto сервисы
import { HashPasswordService } from '@/services/crypto/hashPassword';

describe('HashPasswordService', () => {
  it('should hash and verify password', async () => {
    const service = new HashPasswordService();
    const hash = await service.hash('password123');
    const isValid = await service.verify({ password: 'password123', hash });
    expect(isValid).toBe(true);
  });
});
```

### Repositories

Тесты слоя доступа к данным с мокированными Pool/PoolClient:

```typescript
import { UsersRepository } from '@/repositories/users';

describe('UsersRepository', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
  });

  it('should find user by email', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: '1', email: 'test@test.com' }] });
    
    const repo = new UsersRepository(mockPool);
    const user = await repo.findByEmail('test@test.com');
    
    expect(user).toBeDefined();
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['test@test.com'])
    );
  });
});
```

### Entities

Тесты доменных сущностей:

```typescript
import { UserEntity } from '@/entities/user';

describe('UserEntity', () => {
  it('should create user with valid data', () => {
    const user = UserEntity.create({
      email: 'test@test.com',
      firstName: 'Test',
    });
    
    expect(user.email).toBe('test@test.com');
  });

  it('should reject invalid email', () => {
    expect(() => UserEntity.create({ email: 'invalid', firstName: 'Test' }))
      .toThrow('Invalid email');
  });
});
```

### UseCases

Тесты сценариев использования:

```typescript
import { CreateUserUseCase } from '@/useCases/users/createUser';

describe('CreateUserUseCase', () => {
  let mockUsersRepository: any;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    mockUsersRepository = { create: jest.fn() };
    useCase = new CreateUserUseCase(mockUsersRepository);
  });

  it('should create user', async () => {
    mockUsersRepository.create.mockResolvedValue({ id: '1', email: 'test@test.com' });
    
    const result = await useCase.execute({
      email: 'test@test.com',
      firstName: 'Test',
    });
    
    expect(result.id).toBe('1');
  });
});
```

## 🎯 Best Practices

### Организация

1. **Один файл — один тестируемый компонент**
2. **Describe блоки** для группировки по функциональности
3. **BeforeEach** для создания чистого состояния

### Именование

```typescript
// ✓ Хорошо
it('should return user when email exists');
it('should throw error when email is invalid');
it('should hash password with argon2');

// ✗ Плохо
it('test 1');
it('works');
it('should work');
```

### Структура

```typescript
describe('ServiceName', () => {
  describe('methodName()', () => {
    describe('✓ Valid operations', () => {
      it('should...', () => {});
    });

    describe('✗ Invalid input', () => {
      it('should throw...', () => {});
    });

    describe('🔐 Security', () => {
      it('should reject...', () => {});
    });

    describe('⚡ Performance', () => {
      it('should be fast', () => {});
    });
  });
});
```

### Изоляция

- **Не зависьте от внешнего состояния**
- **Используйте моки для внешних зависимостей**
- **Каждый тест должен быть независим**

### Покрытие

```typescript
// Тестируйте:
// ✓ Обычные случаи (happy path)
// ✓ Граничные значения
// ✓ Ошибочные сценарии
// ✓ Безопасность
// ✓ Производительность (при необходимости)
```

## 📊 Assertions

### Основные

```typescript
expect(value).toBe(expected);
expect(value).toEqual({ key: 'value' });
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
```

### Числа

```typescript
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);
expect(value).toBeCloseTo(3.14, 2);
```

### Строки

```typescript
expect(value).toMatch(/regex/);
expect(value).toContain('substring');
expect(value).toHaveLength(5);
```

### Массивы и объекты

```typescript
expect(array).toContain('item');
expect(array).toContainEqual({ id: 1 });
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', 'value');
```

### Ошибки

```typescript
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
expect(() => fn()).toThrowError(MyError);

await expect(asyncFn()).rejects.toThrow();
await expect(asyncFn()).rejects.toThrow('error');
```

## ⚠️ Частые ошибки

1. **Тестирование нескольких вещей в одном тесте**
2. **Зависимость между тестами**
3. **Отсутствие моков для внешних зависимостей**
4. **Слишком сложные тесты**
5. **Отсутствие описательных имен**
