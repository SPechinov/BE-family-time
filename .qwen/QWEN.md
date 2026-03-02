# BE-family-time Project Context

## Project Overview

**BE-family-time** is a backend API service for managing family groups. Built with modern TypeScript stack, it provides secure user authentication, family group management, and calendar events functionality.

### Core Features

- **Two-step registration** with OTP (One-Time Password) verification
- **Encrypted personal data** storage (firstName, lastName, email, phone)
- **JWT-based authentication** with access/refresh token rotation
- **Rate limiting** on critical endpoints
- **Family group management** with owner/member permissions
- **Calendar events** for family scheduling

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js with ES Modules |
| **Framework** | Fastify 5.x |
| **Language** | TypeScript 5.x |
| **Database** | PostgreSQL 16.3 |
| **Cache** | Redis 7.4 |
| **Validation** | Zod |
| **Testing** | Jest 30.x + Testcontainers |
| **Password Hashing** | Argon2 |
| **JWT** | @fastify/jwt |

### Architecture

Domain-oriented architecture following Clean Architecture principles:

```
src/
├── api/                    # API layer (REST endpoints)
│   └── rest/
│       ├── composites/     # Route compositions (Auth, Groups, Me, CalendarEvents)
│       ├── routes/         # Individual route handlers
│       ├── schemas/        # Request/response validation schemas
│       ├── middlewares/    # Auth, rate limiting, etc.
│       └── utils/          # Error handling, helpers
├── entities/               # Domain entities with encapsulation
│   ├── user.ts            # User entity (plain/encrypted/hashed variants)
│   ├── group.ts           # Group entity
│   ├── groupsUsers.ts     # Group membership entity
│   └── calendarEvents.ts  # Calendar event entity
├── domains/                # Domain logic layer
│   ├── repositories/       # Repository interfaces
│   ├── services/          # Domain services
│   └── useCases/          # Application use cases
├── repositories/           # Data access layer (PostgreSQL)
├── services/              # Application services (JWT, encryption, etc.)
├── useCases/              # Use case implementations
├── pkg/                   # Infrastructure packages
│   ├── fastify/           # Fastify configuration
│   ├── postgres.ts        # PostgreSQL connection
│   ├── redis.ts           # Redis connection
│   └── logger.ts          # Pino logger
├── config/                # Configuration management
└── tests/                 # Integration tests
    ├── integration/       # API integration tests
    ├── fixtures/          # Test data factories
    ├── utils/             # Test utilities (DB, Redis, HTTP)
    └── mocks/             # Mock implementations
```

## Building and Running

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL and Redis)

### Environment Setup

1. **Start infrastructure services:**

```bash
docker-compose up -d postgres redis
```

2. **Configuration:** The app reads configuration from `config/env.yaml`. Ensure it contains:

```yaml
nodeEnv: local
server:
  port: 8000
postgres:
  uri: postgresql://root:root@localhost:5432/main
redis:
  uri: redis://:root@localhost:6379
# ... other config values
```

3. **Run database migrations:**

```bash
npm run migrations:up
```

### Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

### API Server

- **Port:** 8000
- **Base URL:** `http://localhost:8000`
- **Swagger UI (dev only):** `http://localhost:8000/docs`

### API Endpoints

| Module | Endpoints |
|--------|-----------|
| **Auth** | `/api/auth/registration-start`, `/api/auth/registration-end`, `/api/auth/login`, `/api/auth/forgot-password-start`, `/api/auth/forgot-password-end`, `/api/auth/get-all-sessions`, `/api/auth/logout-session`, `/api/auth/logout-all-sessions`, `/api/auth/refresh-tokens` |
| **Me** | `/api/me` (GET) |
| **Groups** | `/api/groups` (POST, GET), `/api/groups/:id` (GET, PATCH, DELETE), `/api/groups/:id/inviteUser`, `/api/groups/:id/excludeUser` |
| **Calendar Events** | `/api/calendar-events` |

## Testing

### Test Architecture

Tests use **Testcontainers** to spin up real PostgreSQL and Redis instances for each test run, ensuring complete isolation.

```bash
# Run all tests
npm run test

# Run integration tests
npm run test:integration

# Watch mode
npm run test:integration:watch

# Run specific module tests
npm run test:auth        # Auth API tests
npm run test:groups      # Groups API tests
npm run test:me          # Me API tests

# With coverage
npm run test:coverage
```

### Test Structure

```
src/tests/
├── integration/
│   ├── auth.test.ts      # ~25 tests for auth endpoints
│   ├── groups.test.ts    # ~33 tests for group management
│   └── me.test.ts        # ~13 tests for user profile
├── fixtures/
│   └── user.fixture.ts   # User/group factories
├── utils/
│   ├── test-db.ts        # PostgreSQL helpers
│   ├── test-redis.ts     # Redis helpers
│   ├── test-http.ts      # Supertest utilities
│   └── test-setup.ts     # Global setup/teardown
└── setup.ts              # Jest global setup
```

### Test Isolation

- **BeforeAll:** Start containers, run migrations, initialize Fastify
- **BeforeEach:** TRUNCATE all tables, FLUSH Redis
- **AfterAll:** Stop containers, close connections

### Writing New Tests

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { SuperTest, Test } from 'supertest';
import { createTestAgent, DEFAULT_HEADERS } from '@/tests/utils/test-http';
import { createUserFixture } from '@/tests/fixtures';

declare global {
  var __TEST_CONTEXT__: {
    fastify: any;
    postgres: Pool;
    redis: RedisClientType;
  } | null;
}

describe('MyModule API Integration Tests', () => {
  let request: SuperTest<Test>;

  beforeAll(async () => {
    const context = globalThis.__TEST_CONTEXT__;
    request = createTestAgent(context.fastify);
  });

  it('should work correctly', async () => {
    const user = createUserFixture();
    const response = await request
      .post('/api/my-endpoint')
      .set(DEFAULT_HEADERS)
      .send({ email: user.email });

    expect(response.status).toBe(200);
  });
});
```

## Development Conventions

### Code Style

- **Formatter:** Prettier (120 char line width, single quotes)
- **Linter:** ESLint with TypeScript and Prettier plugins
- **Module System:** ES Modules (`"type": "module"` in package.json)
- **Path Aliases:** `@/` maps to `src/`

### Entity Pattern

Entities use private fields with getters for encapsulation:

```typescript
export class UserEntity {
  readonly #id: UserId;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;

  constructor(props: UserEntityProps) {
    this.#id = props.id;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
  }

  get id() {
    return this.#id;
  }
}
```

### Entity Variants

- **PlainEntity:** Unencrypted data (for API responses)
- **EncryptedEntity:** Encrypted personal data (for storage)
- **HashedEntity:** Hashed data (email, phone for lookups)
- **PasswordPlain/Hashed:** Password handling

### Error Handling

Global error handler in `src/api/rest/utils/index.ts` catches and formats errors. Use custom error classes from `src/pkg/errors.ts`.

### Configuration

Configuration is validated with Zod schema in `src/config/index.ts`. All config values come from `config/env.yaml`.

### Database Migrations

```bash
# Create new migration
npm run migrations:create

# Run migrations
npm run migrations:up
```

Migration files are in `migrations/` directory using `node-pg-migrate`.

## Security Considerations

### Implemented Security Features

- JWT token validation with signature verification
- Refresh token rotation with cookie storage
- Rate limiting on auth endpoints
- Password hashing with Argon2
- Personal data encryption at rest
- Input validation with Zod schemas
- SQL parameterization (prevents SQL injection)

### Known Security Test Gaps

See `SECURITY_TESTS_REPORT.md` for detailed analysis. Key gaps include:

- SQL injection tests (email, group name fields)
- JWT manipulation tests (tampering, none algorithm)
- IDOR tests (cross-user access)
- Session fixation tests
- Refresh token reuse detection tests
- XSS sanitization tests

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/index.ts` | Application entry point |
| `src/config/index.ts` | Configuration loading and validation |
| `src/api/rest/index.ts` | Fastify server setup |
| `src/entities/user.ts` | User entity definitions |
| `src/pkg/postgres.ts` | PostgreSQL connection factory |
| `src/pkg/redis.ts` | Redis connection factory |
| `src/services/jwt.ts` | JWT service implementation |
| `jest.config.js` | Jest configuration |
| `docker-compose.yaml` | PostgreSQL and Redis services |
| `config/env.yaml` | Application configuration |

## Common Commands

```bash
# Development
npm run dev              # Start with nodemon
npm run build            # Compile TypeScript
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues

# Testing
npm run test             # Run all tests
npm run test:integration # Run integration tests
npm run test:auth        # Run auth tests only
npm run test:watch       # Watch mode

# Database
npm run migrations:up    # Run migrations
npm run migrations:create # Create new migration

# Docker
docker-compose up -d postgres redis  # Start services
docker-compose down                  # Stop services
```

## Troubleshooting

### Test Context Not Initialized

Ensure `globalSetup` and `globalTeardown` are configured in `jest.config.js`:

```javascript
export default {
  globalSetup: '<rootDir>/src/tests/setup.ts',
  globalTeardown: '<rootDir>/src/tests/setup.ts',
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest-setup.ts'],
};
```

### Connection Refused to DB/Redis

Check services are running:

```bash
docker-compose ps
```

Or use custom ports:

```bash
TEST_DB_PORT=5433 TEST_REDIS_PORT=6380 npm run test
```

### Test Timeouts

Tests have 120s timeout for container startup. If issues persist, increase in `jest.config.js`:

```javascript
export default {
  testTimeout: 120000,
};
```

## Project Status

- **Version:** 1.0.0
- **Test Coverage:** 71 integration tests (~15% security coverage)
- **Active Development:** Yes
