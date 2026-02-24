# История чата — Рефакторинг групп и транзакций

## Дата: 2026-02-24

## Краткое описание
Разделение сервиса `GroupsService` на два независимых сервиса + добавление транзакций через `DbTransactionService`.

---

## Выполненные изменения

### 1. Разделение сервисов
**Было:** `GroupsService` управлял двумя таблицами (`groups` и `users_groups`)

**Стало:**
- `GroupsService` — только таблица `groups`
- `GroupsUsersService` — только таблица `groups_users`

**Файлы:**
```
src/services/groups/groups.ts          # Только groups
src/services/groupsUsers/groupsUsers.ts # Только groups_users
```

---

### 2. Переименование UsersGroups → GroupsUsers
**Причина:** `GroupsUsers` читается логичнее (сначала группа, потом пользователи)

**Изменения:**
| Было | Стало |
|------|-------|
| `UsersGroupsEntity` | `GroupsUsersEntity` |
| `IUsersGroupsService` | `IGroupsUsersService` |
| `UsersGroupsRepository` | `GroupsUsersRepository` |
| Таблица `users_groups` | Таблица `groups_users` |

**Файлы миграции:**
```
migrations/3_create_groups-users_table.sql
```

---

### 3. Расширение GroupsService (полный CRUD)
**Добавлены методы:**
```typescript
// Сервис
findMany(groupFindManyEntity?: GroupFindManyEntity): Promise<GroupEntity[]>
deleteOne(groupFindOneEntity: GroupFindOneEntity): Promise<void>

// Сущность для фильтрации
class GroupFindManyEntity {
  ids?: UUID[]    // WHERE id IN (...)
  name?: string   // WHERE name ILIKE '%...%'
}
```

---

### 4. Транзакции через DbTransactionService
**Проблема:** При создании группы сначала создаётся запись в `groups`, потом в `groups_users`. Если второй шаг падает — первая запись остаётся (неконсистентность).

**Решение:**
```typescript
// pkg/dbTransaction.ts
export interface IDbTransactionService {
  executeInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}

// useCases/groups/groups.ts
return this.#transactionService.executeInTransaction(async (client) => {
  const group = await this.#groupsService.createOne(entity, { client });
  await this.#groupsUsersService.createOne(entity, { client });
  return group;
});
```

**Преимущества:**
- UseCase не зависит от репозиториев (чистая архитектура)
- При ошибке любой операции — автоматический `ROLLBACK`
- Сервис можно переиспользовать в других useCase'ах

---

### 5. Удаление BaseRepository
**Было:**
```typescript
abstract class BaseRepository {
  protected pool: Pool;
  async withTransaction<T>(fn: ...): Promise<T> { ... }
}
```

**Стало:** Каждый репозиторий имеет собственное поле:
```typescript
class GroupsRepository implements IGroupsRepository {
  readonly #pool: Pool;
  constructor(pool: Pool) { this.#pool = pool; }
}
```

**Причина:** 
- Пустой интерфейс `IBaseRepository` не нёс пользы
- Наследование без общей логики — излишняя абстракция
- Меньше кода = проще поддержка

---

## Поддержка транзакций во всех сервисах
Все методы репозиториев и сервисов принимают опциональный `client`:
```typescript
createOne(entity: Entity, options?: { client?: PoolClient }): Promise<Result>
```

Если `client` не передан — используется обычный `pool.query()`.

---

## Структура файлов (итог)
```
src/
├── pkg/
│   └── dbTransaction.ts        # Новый сервис транзакций
├── entities/
│   ├── group.ts                # + GroupFindManyEntity
│   └── groupsUsers.ts          # Переименовано из usersGroups.ts
├── domains/services/
│   ├── groups.ts               # Обновлён интерфейс
│   └── groupsUsers.ts          # Новый интерфейс
├── domains/repositories/db/
│   ├── groups.ts               # + findMany, deleteOne
│   └── groupsUsers.ts          # Обновлён интерфейс
├── repositories/db/
│   ├── groups/
│   │   └── groups.ts           # + findMany, deleteOne
│   └── groupsUsers/
│       └── groupsUsers.ts      # Поддержка client
├── services/
│   ├── groups/
│   │   └── groups.ts           # Полный CRUD
│   └── groupsUsers/
│       └── groupsUsers.ts      # Новый сервис
└── useCases/groups/
    └── groups.ts               # Использует DbTransactionService
```

---

## Команды для проверки
```bash
npm run build                    # Сборка
npm run test                     # Все тесты
npx jest src/repositories/db/groupsUsers/groupsUsers.test.ts  # Тесты репозитория
```

---

## Ключевые файлы для контекста
1. **Контекст проекта:** `.qwen/QWEN.md`
2. **Транзакции:** `src/pkg/dbTransaction.ts`
3. **UseCase с транзакцией:** `src/useCases/groups/groups.ts`
4. **Зависимости:** `src/api/rest/composites/routes/groups/utils.ts`
