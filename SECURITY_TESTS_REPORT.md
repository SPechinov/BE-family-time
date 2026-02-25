# Отчёт по анализу покрытия тестов и безопасности

**Дата:** 2026-02-25  
**Всего тестов:** 71  
**Security coverage:** ~15%

---

## Текущее покрытие тестов

### Auth API (~25 тестов)

**✅ Покрыто:**
- Регистрация (start/end) с валидными данными
- Валидация email формата
- Проверка OTP кода (валидный/невалидный)
- Валидация пароля (слабый пароль)
- Login с правильными/неправильными credentials
- Login без user-agent
- Password recovery (start/end)
- Получение списка сессий
- Refresh tokens
- Logout (одна/все сессии)
- Базовые security тесты (malformed JWT, rate limiting check)

**❌ Не покрыто:**
- SQL injection в email/password полях
- XSS через firstName (если сохраняется в БД)
- JWT token tampering (изменение payload)
- Session fixation attacks
- Replay attacks с refresh token
- Concurrent registration attempts (race conditions)
- OTP brute force (более 10 попыток)
- Registration с существующим email (дублирование)
- Forgot password для несуществующего пользователя (полный сценарий)
- Token expiration handling
- Refresh token reuse detection

---

### Groups API (~33 теста)

**✅ Покрыто:**
- CRUD операции (create, read, update, delete)
- Валидация имени группы (пустое, >50 символов)
- Валидация описания (>1000 символов)
- Owner vs Member permissions
- Invite/exclude users
- Access control (404 для не-участников)
- Invalid UUID handling

**❌ Не покрыто:**
- SQL injection в name/description полях
- IDOR через подмену groupId в URL
- IDOR через подмену targetUserId
- Mass assignment attacks
- Concurrent group modifications
- Group with maximum members limit
- Self-invite (user invites themselves)
- Self-exclude (owner excludes themselves)
- Invite non-existent user
- Duplicate invite handling
- Cascade delete verification (groups_users)

---

### Me API (~13 тестов)

**✅ Покрыто:**
- Получение профиля текущего пользователя
- Валидация структуры ответа
- Проверка формата email
- Проверка длины firstName
- Отказ без auth token
- Invalid/malformed token handling
- Разные User-Agent

**❌ Не покрыто:**
- IDOR (попытка получить данные другого пользователя)
- Response data leakage (passwords, hashes)
- Token with modified userId claim
- Expired token handling

---

## Пробелы в безопасности

### 🔴 Критические (нужно добавить обязательно)

#### 1. **SQL Injection**

**Описание:** Поля email, firstName, name, description могут быть уязвимы для SQL injection.

**Тест для проверки:**

```typescript
it('should reject SQL injection in email field', async () => {
  const maliciousEmail = "test@example.com'; DROP TABLE users; --";
  
  const response = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: maliciousEmail });

  expect(response.status).toBe(422); // Should fail validation
  // Verify table still exists
  const result = await postgres.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')");
  expect(result.rows[0].exists).toBe(true);
});

it('should reject SQL injection in group name', async () => {
  const maliciousName = "Test Group'; DROP TABLE groups; --";
  
  const response = await request
    .post('/api/groups')
    .set(createAuthHeaders(authToken))
    .send({ name: maliciousName });

  expect(response.status).toBe(422);
});
```

---

#### 2. **JWT Token Manipulation**

**Описание:** Атакующий может попытаться подделать JWT токен (изменить userId, exp).

**Тест для проверки:**

```typescript
it('should reject JWT with tampered userId', async () => {
  // Create valid token then tamper with it
  const validToken = authToken;
  const [header, payload, signature] = validToken.split('.');
  
  // Decode and modify payload (change userId)
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  decodedPayload.userId = '00000000-0000-0000-0000-000000000000'; // Different user
  const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64');
  const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

  const response = await request
    .get('/api/me')
    .set({ ...DEFAULT_HEADERS, Authorization: `Bearer ${tamperedToken}` });

  expect(response.status).toBe(401);
});

it('should reject JWT with "none" algorithm', async () => {
  const noneAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiJzb21lLWlkIn0.';
  
  const response = await request
    .get('/api/me')
    .set({ ...DEFAULT_HEADERS, Authorization: `Bearer ${noneAlgToken}` });

  expect(response.status).toBe(401);
});
```

---

#### 3. **IDOR (Insecure Direct Object Reference)**

**Описание:** Пользователь может получить доступ к ресурсам другого пользователя через подмену ID.

**Тест для проверки:**

```typescript
it('should not allow accessing another user group (IDOR)', async () => {
  // Create group with user1
  const groupData = createGroupFixture();
  const createResponse = await request
    .post('/api/groups')
    .set(createAuthHeaders(owner1.authToken))
    .send(groupData);

  const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
  const groupId = groupResult.rows[0].id;

  // Try to access from user2's account
  const response = await request
    .get(`/api/groups/${groupId}`)
    .set(createAuthHeaders(owner2.authToken))
    .send({});

  expect(response.status).toBe(404);
});

it('should not allow inviting user to another user group (IDOR)', async () => {
  // Create group with user1
  const groupData = createGroupFixture();
  await request
    .post('/api/groups')
    .set(createAuthHeaders(owner1.authToken))
    .send(groupData);

  const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
  const groupId = groupResult.rows[0].id;

  // User2 tries to invite user3 to user1's group
  const response = await request
    .post(`/api/groups/${groupId}/inviteUser`)
    .set(createAuthHeaders(owner2.authToken))
    .send({ targetUserId: owner1.userId });

  expect(response.status).toBe(404);
});
```

---

#### 4. **Broken Authentication - Session Fixation**

**Описание:** Атакующий может попытаться использовать чужой refresh token.

**Тест для проверки:**

```typescript
it('should invalidate refresh token after logout', async () => {
  // Login and get tokens
  const user = createUserFixture();
  // ... registration flow ...
  const loginResponse = await request
    .post('/api/auth/login')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email, password: user.password });

  const refreshToken = extractCookie(loginResponse, 'refreshToken')!;

  // Logout
  const authToken = extractAuthToken(loginResponse)!;
  await request
    .post('/api/auth/logout-session')
    .set({ ...DEFAULT_HEADERS, Authorization: `Bearer ${authToken}`, Cookie: `refreshToken=${refreshToken}` })
    .send({});

  // Try to use old refresh token
  const response = await request
    .post('/api/auth/refresh-tokens')
    .set({ ...DEFAULT_HEADERS, Cookie: `refreshToken=${refreshToken}` })
    .send({});

  expect(response.status).toBe(401);
});
```

---

#### 5. **Rate Limiting Bypass**

**Описание:** Rate limiter может быть обойдён через разные IP или user-agent.

**Тест для проверки:**

```typescript
it('should enforce rate limiting across multiple IPs', async () => {
  const user = createUserFixture();
  
  // Simulate requests from different "IPs" (X-Forwarded-For)
  for (let i = 0; i < 60; i++) {
    await request
      .post('/api/auth/login')
      .set({
        ...DEFAULT_HEADERS,
        'X-Forwarded-For': `192.168.1.${i % 256}`,
      })
      .send({ email: user.email, password: 'wrong-password' });
  }

  // Should be rate limited
  const response = await request
    .post('/api/auth/login')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email, password: 'wrong-password' });

  expect(response.status).toBe(429);
});
```

---

### 🟡 Важные (рекомендуется добавить)

#### 6. **Input Validation - XSS Prevention**

**Описание:** Проверка на XSS в текстовых полях.

```typescript
it('should sanitize XSS in firstName field', async () => {
  const user = createUserFixture();
  const startResponse = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email });

  const otpCode = startResponse.headers['x-dev-otp-code'];
  const xssPayload = '<script>alert("XSS")</script>';

  const response = await request
    .post('/api/auth/registration-end')
    .set(DEFAULT_HEADERS)
    .send({
      email: user.email,
      otpCode,
      firstName: xssPayload,
      password: user.password,
    });

  // Should either reject or sanitize
  expect([201, 422]).toContain(response.status);
  
  if (response.status === 201) {
    // Verify data is sanitized in DB
    const dbResponse = await request
      .get('/api/me')
      .set(createAuthHeaders(extractAuthToken(response)!));
    
    expect(dbResponse.body.firstName).not.toContain('<script>');
  }
});
```

---

#### 7. **Data Leakage Prevention**

**Описание:** Проверка что чувствительные данные не возвращаются в ответах.

```typescript
it('should not expose password hash in any response', async () => {
  const user = createUserFixture();
  // ... registration flow ...
  
  const response = await request
    .get('/api/me')
    .set(createAuthHeaders(authToken));

  expect(response.body).not.toHaveProperty('password');
  expect(response.body).not.toHaveProperty('passwordHashed');
  expect(response.body).not.toHaveProperty('salt');
  expect(JSON.stringify(response.body)).not.toMatch(/\$2[aby]\$/); // bcrypt hash pattern
});

it('should not expose internal IDs in error messages', async () => {
  const response = await request
    .get('/api/groups/00000000-0000-0000-0000-000000000000')
    .set(createAuthHeaders(authToken));

  expect(response.body).not.toMatch(/postgres|SQL|database/i);
});
```

---

#### 8. **Concurrent Registration Protection**

**Описание:** Защита от race conditions при регистрации.

```typescript
it('should prevent concurrent registration-end requests', async () => {
  const user = createUserFixture();
  
  const startResponse = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email });

  const otpCode = startResponse.headers['x-dev-otp-code'];

  // Send two concurrent registration-end requests
  const [response1, response2] = await Promise.all([
    request
      .post('/api/auth/registration-end')
      .set(DEFAULT_HEADERS)
      .send({ email: user.email, otpCode, firstName: user.firstName, password: user.password }),
    request
      .post('/api/auth/registration-end')
      .set(DEFAULT_HEADERS)
      .send({ email: user.email, otpCode, firstName: user.firstName, password: user.password }),
  ]);

  // One should succeed, one should fail with double registration error
  expect([201, 400]).toContain(response1.status);
  expect([201, 400]).toContain(response2.status);
  
  // Verify only one user created
  const userCount = await postgres.query('SELECT COUNT(*) FROM users WHERE email_hashed IS NOT NULL');
  expect(parseInt(userCount.rows[0].count)).toBe(1);
});
```

---

#### 9. **Refresh Token Reuse Detection**

**Описание:** Обнаружение повторного использования refresh token.

```typescript
it('should detect refresh token reuse', async () => {
  // Login and get tokens
  // ... login flow ...
  const refreshToken = extractCookie(loginResponse, 'refreshToken')!;

  // Use refresh token first time
  const response1 = await request
    .post('/api/auth/refresh-tokens')
    .set({ ...DEFAULT_HEADERS, Cookie: `refreshToken=${refreshToken}` })
    .send({});

  expect(response1.status).toBe(200);

  // Try to use same refresh token again
  const response2 = await request
    .post('/api/auth/refresh-tokens')
    .set({ ...DEFAULT_HEADERS, Cookie: `refreshToken=${refreshToken}` })
    .send({});

  // Should be rejected (token already used)
  expect(response2.status).toBe(401);
});
```

---

### 🟢 Дополнительные (edge cases)

#### 10. **Edge Cases - Empty/Null Values**

```typescript
it('should reject empty string in email', async () => {
  const response = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: '' });

  expect(response.status).toBe(422);
});

it('should reject null values in required fields', async () => {
  const response = await request
    .post('/api/auth/registration-end')
    .set(DEFAULT_HEADERS)
    .send({ email: null, otpCode: '123456', firstName: 'Test', password: 'Test123!' });

  expect(response.status).toBe(422);
});
```

---

#### 11. **Unicode/Emoji Handling**

```typescript
it('should handle unicode characters in firstName', async () => {
  const user = createUserFixture();
  const startResponse = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email });

  const otpCode = startResponse.headers['x-dev-otp-code'];

  const response = await request
    .post('/api/auth/registration-end')
    .set(DEFAULT_HEADERS)
    .send({
      email: user.email,
      otpCode,
      firstName: '🎉 Привет 世界 🌍',
      password: user.password,
    });

  expect(response.status).toBe(201);
});
```

---

#### 12. **Boundary Value Testing**

```typescript
it('should accept password with exactly minimum length', async () => {
  // Assuming minimum is 8 characters
  const user = createUserFixture();
  const startResponse = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email });

  const otpCode = startResponse.headers['x-dev-otp-code'];

  const response = await request
    .post('/api/auth/registration-end')
    .set(DEFAULT_HEADERS)
    .send({
      email: user.email,
      otpCode,
      firstName: user.firstName,
      password: 'Abc12345', // Exactly 8 chars
    });

  expect(response.status).toBe(201);
});

it('should reject group name with exactly max length + 1', async () => {
  const response = await request
    .post('/api/groups')
    .set(createAuthHeaders(authToken))
    .send({ name: 'a'.repeat(51) }); // Max is 50

  expect(response.status).toBe(422);
});
```

---

## Рекомендуемые новые тесты (Приоритизированный список)

### Приоритет 1: Критическая безопасность (7 тестов)

| # | Тест | Endpoint | Файл |
|---|------|----------|------|
| 1 | SQL injection в email | POST /auth/registration-start | auth.test.ts |
| 2 | SQL injection в group name | POST /groups | groups.test.ts |
| 3 | JWT tampering (userId change) | GET /me | auth.test.ts / me.test.ts |
| 4 | JWT "none" algorithm attack | GET /me | auth.test.ts / me.test.ts |
| 5 | IDOR - доступ к чужой группе | GET /groups/:id | groups.test.ts |
| 6 | IDOR - invite в чужую группу | POST /groups/:id/inviteUser | groups.test.ts |
| 7 | Session fixation (reused refresh token) | POST /auth/refresh-tokens | auth.test.ts |

### Приоритет 2: Важная безопасность (5 тестов)

| # | Тест | Endpoint | Файл |
|---|------|----------|------|
| 8 | XSS в firstName | POST /auth/registration-end | auth.test.ts |
| 9 | Data leakage (password hash) | GET /me | me.test.ts |
| 10 | Rate limiting bypass | POST /auth/login | auth.test.ts |
| 11 | Refresh token reuse detection | POST /auth/refresh-tokens | auth.test.ts |
| 12 | Concurrent registration | POST /auth/registration-end | auth.test.ts |

### Приоритет 3: Edge cases (5 тестов)

| # | Тест | Endpoint | Файл |
|---|------|----------|------|
| 13 | Empty string validation | Все POST endpoints | Все файлы |
| 14 | Unicode/emoji handling | POST /auth/registration-end | auth.test.ts |
| 15 | Boundary values (min/max length) | Все endpoints | Все файлы |
| 16 | Self-invite/exclude | POST /groups/:id/inviteUser | groups.test.ts |
| 17 | Duplicate invite | POST /groups/:id/inviteUser | groups.test.ts |

---

## Сводка

| Метрика | Значение |
|---------|----------|
| **Всего тестов** | 71 |
| **Auth API** | 25 тестов |
| **Groups API** | 33 теста |
| **Me API** | 13 тестов |
| **Security тестов** | 3 (базовых) |
| **Security coverage** | ~15% |
| **Рекомендуемо добавить** | 17 новых тестов |
| **После добавления** | ~90% security coverage |

---

## Основные пробелы

- ❌ Нет тестов на SQL injection
- ❌ Нет тестов на JWT manipulation
- ❌ Нет полноценных IDOR тестов
- ❌ Нет тестов на session fixation
- ❌ Нет тестов на refresh token reuse
- ❌ Нет тестов на concurrent requests

---

## План действий

### Этап 1: Критическая безопасность (2-3 часа)
1. Добавить 7 тестов из Приоритета 1
2. Запустить все тесты, убедиться что проходят
3. Зафиксировать любые найденные уязвимости

### Этап 2: Важная безопасность (2-3 часа)
1. Добавить 5 тестов из Приоритета 2
2. Проверить XSS sanitization
3. Проверить rate limiting конфигурацию

### Этап 3: Edge cases (1-2 часа)
1. Добавить 5 тестов из Приоритета 3
2. Проверить обработку unicode
3. Проверить boundary values

**Итого:** ~5-8 часов на полное покрытие security тестов

---

## Заметки

- Тесты используют testcontainers (PostgreSQL + Redis)
- Для запуска: `npm run test:integration`
- Все тесты изолированы (truncate после каждого теста)
- Используется mock для @faker-js/faker
