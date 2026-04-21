# PROJECT CONTEXT

Короткий технический snapshot для быстрых задач по репозиторию.
Перед стартом новой задачи сначала стоит читать этот файл, а затем при необходимости открывать `README.md`.

## Project

- Name: `be-family-time`
- Type: Backend REST API
- Stack: TypeScript, Fastify, PostgreSQL, Redis, Zod, JWT, Pino, Jest, Testcontainers
- Entry point: `src/index.ts`
- Main documentation: `README.md`

## Architecture

- API layer: `src/api/rest/`
- Use cases: `src/useCases/`
- Domain contracts: `src/domains/`
- Services: `src/services/`
- Repositories: `src/repositories/`
- Entities: `src/entities/`
- Infra utils: `src/pkg/`

Dependency direction:

- Routes/controllers -> use cases -> services -> repositories -> PostgreSQL/Redis

## API Surface

- Base prefix: `/api`
- Route groups:
  - `/api/auth/*`
  - `/api/me/*`
  - `/api/groups/*`
  - `/api/groups/:groupId/calendar-events/*`

## Main Business Areas

- Auth:
  - OTP-based registration
  - login/logout
  - refresh tokens
  - session management in Redis
- Me:
  - current profile read/update
- Groups:
  - create/read/update/delete
  - invite/exclude members
  - exactly one owner per group
- Calendar events:
  - CRUD inside group
  - supports `oneTime`, `weekly`, `monthly`, `yearly`

## User Model

Separate plain profile fields:

- `timeZone` -> DB column `time_zone`
- `language` -> DB column `language`, values `ru | en`

Sensitive fields handling:

- `email`, `phone`:
  - hashed for lookup/uniqueness
  - encrypted for readback
- `firstName`, `lastName` -> encrypted
- `dateOfBirth` -> stored plain
- `password` -> argon2 hash

## Important Rules

- `timeZone` and `language` remain outside `personalInfo`.
- Group count per user is limited by `CONFIG.limits.user.maxGroups`.
- User count per group is limited by `CONFIG.limits.group.maxUsers`.
- Group owner can invite/exclude users and edit/delete group.
- Group deletion is allowed only when owner is the last member.
- `weekly` and `monthly` calendar events require valid `recurrencePattern`.

## Auth Notes

- Access and refresh tokens are set and read via `httpOnly` cookies.
- Refresh sessions are stored in Redis.
- Access token blacklist is stored in Redis with TTL.
- In dev mode OTP is exposed via `x-dev-otp-code`.

## Runtime Commands

- Dev: `npm run dev`
- Build/typecheck: `npm run build`
- Lint: `npm run lint`
- Tests: `npm test`
- Integration subset: `npm run test:integration`
- Migrations: `npm run migrations:up`

## Testing Constraints

- Integration tests use Testcontainers and require Docker runtime.
- Test environment starts PostgreSQL and Redis containers automatically.
- In restricted environments `npm run build` is the minimum reliable verification.

## Known Technical Notes

- `docker-compose.yaml` database name differs from `config/env.yaml` and migration script target.
- Redis password expectations in `docker-compose.yaml` and app config are not fully synchronized.
- The project mostly uses `TIMESTAMP`, not `TIMESTAMPTZ`.
- Period filtering for recurring calendar events is simplified in repository logic.

## Documentation Rule

When code changes affect architecture, routes, config, migrations, business rules, or testing flow, update both:

- `README.md`
- `PROJECT_CONTEXT.md`
