# PROJECT CONTEXT (for assistant)

This file is a compact, always-up-to-date context snapshot for work in this repository.
Assistant should read this file at the start of future tasks.

## Project

- Name: `be-family-time`
- Type: Backend REST API
- Stack: TypeScript, Fastify, PostgreSQL, Redis, Zod, JWT, Pino, Jest
- Entry point: `src/index.ts`

## Architecture

- API layer: `src/api/rest/`
- Use cases: `src/useCases/`
- Domain contracts: `src/domains/`
- Services: `src/services/`
- Repositories: `src/repositories/`
- Entities: `src/entities/`
- Infra utils: `src/pkg/`

Dependency direction:
- Routes/controllers -> use cases/services -> repositories -> DB/Redis

## Main Runtime Commands

- Dev: `npm run dev`
- Build/typecheck: `npm run build`
- Tests: `npm test`
- Integration subset: `npm run test:integration`

## API Notes

- Base prefix: `/api`
- Main route groups:
  - `/api/auth/*`
  - `/api/me/*`
  - `/api/groups/*`
  - `/api/:groupId/calendar-events/*`

## User Model (current)

Important user settings are stored as separate plain fields:

- `timeZone` (IANA string, DB column `time_zone`)
- `language` (`'ru' | 'en'`, DB column `language`, default `ru`)

Personal profile fields:

- `firstName`, `lastName` -> encrypted
- `dateOfBirth` -> plain (not encrypted/hashed), part of `personalInfo` in domain model

Auth registration (`registration-end`) currently expects:

- `email`
- `otpCode`
- `firstName`
- `password`
- `timeZone`
- `language`

`GET /me` returns `timeZone` and `language`.
`PATCH /me` can update `timeZone` and `language` (plus personal fields).

## Validation Rules (current)

- `timeZone`: validated as IANA timezone in `GLOBAL_SCHEMAS.timeZone`
- `language`: validated as enum `['ru', 'en']` in `GLOBAL_SCHEMAS.language`
- Shared language source in entities:
  - `USER_LANGUAGES`
  - `UserLanguage`

## Error Handling

- Global handler: `src/api/rest/utils/errorsHandler.ts`
- Business errors from `src/pkg/errors.ts`
- Standard shape includes `statusCode`, `originalUrl`, `timestamp`, optional `code/message`

## Testing Constraints

- Integration tests use Testcontainers.
- In environments without Docker/container runtime, integration tests fail to start.
- `npm run build` is the reliable baseline verification in restricted environments.

## Current Practical Conventions

- Keep `timeZone` and `language` outside `personalInfo`.
- Keep DB timestamps in UTC (`timestamptz` where relevant), user timezone for display/period calculations.
- For language scope now: only `ru` and `en`.

