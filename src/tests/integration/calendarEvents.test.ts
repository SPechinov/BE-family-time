/**
 * Integration tests for Calendar Events API endpoints
 * Tests cover: CRUD operations, filtering, validation, access control
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { createTestAgent, DEFAULT_HEADERS, extractAuthToken, createAuthHeaders } from '../utils/test-http';
import { createUserFixture, createGroupFixture, TestUserData } from '../fixtures/user.fixture';
import { setupTestEnvironment, teardownTestEnvironment } from '../utils/test-setup.js';

// Initialize test context
beforeAll(async () => {
  if (!(globalThis as any).__TEST_CONTEXT__) {
    (globalThis as any).__TEST_CONTEXT__ = await setupTestEnvironment();
    console.log('Test environment initialized');
  }
});

// Cleanup after all tests
afterAll(async () => {
  const context = globalThis.__TEST_CONTEXT__;
  if (context?.postgres) {
    await context.postgres.query('DELETE FROM calendar_events');
    await context.postgres.query('DELETE FROM groups_users');
    await context.postgres.query('DELETE FROM groups');
  }
  
  if ((globalThis as any).__TEST_CONTEXT__) {
    await teardownTestEnvironment();
    (globalThis as any).__TEST_CONTEXT__ = null;
    console.log('Test environment cleaned up');
  }
});

// Cleanup after each test
afterEach(async () => {
  const context = globalThis.__TEST_CONTEXT__;
  if (context?.postgres) {
    await context.postgres.query('DELETE FROM calendar_events');
  }
});

const API_PREFIX = '/api/groups';

interface AuthTokens {
  authToken: string;
  email: string;
  userId: string;
}

async function registerAndLogin(request: any): Promise<AuthTokens> {
  const user = createUserFixture();

  const startResponse = await request
    .post('/api/auth/registration-start')
    .set(DEFAULT_HEADERS)
    .send({ email: user.email });

  const otpCode = startResponse.headers['x-dev-otp-code'];

  await request.post('/api/auth/registration-end').set(DEFAULT_HEADERS).send({
    email: user.email,
    otpCode,
    firstName: user.firstName,
    password: user.password,
  });

  const loginResponse = await request.post('/api/auth/login').set(DEFAULT_HEADERS).send({
    email: user.email,
    password: user.password,
  });

  const authToken = extractAuthToken(loginResponse);
  if (!authToken) {
    throw new Error(`Failed to extract auth token from login response. Status: ${loginResponse.status}`);
  }

  const userResult = await request.get('/api/me').set({
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${authToken}`,
  });

  if (userResult.status !== 200) {
    throw new Error(`Failed to get user info. Status: ${userResult.status}`);
  }

  return {
    authToken,
    email: user.email,
    userId: userResult.body.id,
  };
}

async function createGroupWithMember(
  request: any,
  owner: AuthTokens,
  member: AuthTokens,
  postgres: Pool,
): Promise<string> {
  const groupData = createGroupFixture();
  
  const createGroupResponse = await request
    .post(API_PREFIX)
    .set(createAuthHeaders(owner.authToken))
    .send(groupData);

  if (createGroupResponse.status !== 201) {
    throw new Error(`Failed to create group. Status: ${createGroupResponse.status}`);
  }

  const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [
    groupData.name,
  ]);
  
  if (groupResult.rows.length === 0) {
    throw new Error('Group not found in database after creation');
  }
  
  const groupId = groupResult.rows[0].id;

  await request
    .post(`${API_PREFIX}/${groupId}/inviteUser`)
    .set(createAuthHeaders(owner.authToken))
    .send({ targetUserId: member.userId });

  return groupId;
}

function createCalendarEventFixture(overrides?: {
  title?: string;
  description?: string;
  eventType?: 'birthday' | 'vacation' | 'holiday';
  iterationType?: 'oneTime' | 'weekly' | 'monthly' | 'yearly';
  recurrencePattern?: { type: 'weekly' | 'monthly'; dayOfWeek?: number; dayOfMonth?: number };
  startDate?: string;
  endDate?: string;
}) {
  return {
    title: overrides?.title ?? 'Test Event',
    description: overrides?.description ?? 'Test Description',
    eventType: overrides?.eventType ?? 'birthday',
    iterationType: overrides?.iterationType ?? 'oneTime',
    recurrencePattern: overrides?.recurrencePattern,
    startDate: overrides?.startDate ?? '2026-06-15T10:00:00.000Z',
    endDate: overrides?.endDate,
  };
}

describe('Calendar Events API Integration Tests', () => {
  let request: any;
  let owner: AuthTokens;
  let member: AuthTokens;
  let nonMember: AuthTokens;
  let groupId: string;
  let postgres: Pool;

  beforeAll(async () => {
    const context = globalThis.__TEST_CONTEXT__;
    if (!context) {
      throw new Error('Test context not initialized');
    }
    request = createTestAgent(context.fastify);
    postgres = context.postgres;

    owner = await registerAndLogin(request);
    member = await registerAndLogin(request);
    nonMember = await registerAndLogin(request);

    groupId = await createGroupWithMember(request, owner, member, postgres);
  });

  // ==================== CREATE TESTS ====================

  describe('POST /api/groups/:groupId/calendar-events', () => {
    it('should create one-time event successfully', async () => {
      const eventData = createCalendarEventFixture({
        iterationType: 'oneTime',
        title: 'One-time Event',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: eventData.title,
        iterationType: eventData.iterationType,
        type: eventData.eventType ?? undefined,
      });
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should create yearly event successfully', async () => {
      const eventData = createCalendarEventFixture({
        iterationType: 'yearly',
        title: 'Yearly Birthday',
        eventType: 'birthday',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.iterationType).toBe('yearly');
    });

    it('should create weekly event with recurrencePattern', async () => {
      const eventData = createCalendarEventFixture({
        iterationType: 'weekly',
        title: 'Weekly Meeting',
        recurrencePattern: {
          type: 'weekly',
          dayOfWeek: 1,
        },
        startDate: '2026-03-02T10:00:00.000Z',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.recurrencePattern).toEqual(eventData.recurrencePattern);
    });

    it('should create monthly event with recurrencePattern', async () => {
      const eventData = createCalendarEventFixture({
        iterationType: 'monthly',
        title: 'Monthly Review',
        recurrencePattern: {
          type: 'monthly',
          dayOfMonth: 15,
        },
        startDate: '2026-03-15T10:00:00.000Z',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.recurrencePattern).toEqual(eventData.recurrencePattern);
    });

    it('should create event with description', async () => {
      const eventData = createCalendarEventFixture({
        description: 'Detailed description for the event',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(eventData.description);
    });

    it('should create event without eventType (optional)', async () => {
      const eventData = {
        title: 'Event without type',
        iterationType: 'oneTime',
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.type).toBeUndefined();
    });

    it('should create event with endDate', async () => {
      const eventData = createCalendarEventFixture({
        startDate: '2026-06-15T10:00:00.000Z',
        endDate: '2026-06-16T10:00:00.000Z',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.endDate).toBeDefined();
    });

    it('should create event with unicode in title', async () => {
      const eventData = createCalendarEventFixture({
        title: '🎉 День рождения 世界',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('🎉 День рождения 世界');
    });

    // NEGATIVE TESTS

    it('should reject event without title', async () => {
      const eventData = {
        iterationType: 'oneTime',
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with empty title', async () => {
      const eventData = createCalendarEventFixture({ title: '' });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with title > 50 chars', async () => {
      const eventData = createCalendarEventFixture({ title: 'a'.repeat(51) });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with XSS in title', async () => {
      const eventData = createCalendarEventFixture({
        title: '<script>alert("xss")</script>',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with description > 1000 chars', async () => {
      const eventData = createCalendarEventFixture({ description: 'a'.repeat(1001) });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with invalid iterationType', async () => {
      const eventData = {
        title: 'Test',
        iterationType: 'invalid',
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with invalid eventType', async () => {
      const eventData = createCalendarEventFixture({ eventType: 'invalid' as any });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with invalid startDate', async () => {
      const eventData = {
        title: 'Test',
        iterationType: 'oneTime',
        startDate: 'invalid-date',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with endDate < startDate', async () => {
      const eventData = createCalendarEventFixture({
        startDate: '2026-06-15T10:00:00.000Z',
        endDate: '2026-06-14T10:00:00.000Z',
      });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(500);
    });

    it('should reject weekly event without recurrencePattern', async () => {
      const eventData = {
        title: 'Weekly without pattern',
        iterationType: 'weekly',
        startDate: '2026-03-02T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(500);
    });

    it('should reject monthly event without recurrencePattern', async () => {
      const eventData = {
        title: 'Monthly without pattern',
        iterationType: 'monthly',
        startDate: '2026-03-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(500);
    });

    it('should reject oneTime event with recurrencePattern', async () => {
      const eventData = {
        title: 'OneTime with pattern',
        iterationType: 'oneTime',
        recurrencePattern: { type: 'weekly', dayOfWeek: 1 },
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(500);
    });

    it('should reject yearly event with recurrencePattern', async () => {
      const eventData = {
        title: 'Yearly with pattern',
        iterationType: 'yearly',
        recurrencePattern: { type: 'monthly', dayOfMonth: 15 },
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(500);
    });

    it('should reject weekly event with invalid dayOfWeek', async () => {
      const eventData = {
        title: 'Weekly invalid day',
        iterationType: 'weekly',
        recurrencePattern: { type: 'weekly', dayOfWeek: 7 },
        startDate: '2026-03-02T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject monthly event with invalid dayOfMonth', async () => {
      const eventData = {
        title: 'Monthly invalid day',
        iterationType: 'monthly',
        recurrencePattern: { type: 'monthly', dayOfMonth: 32 },
        startDate: '2026-03-15T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(422);
    });

    it('should reject event with wrong recurrencePattern type', async () => {
      const eventData = {
        title: 'Wrong pattern type',
        iterationType: 'weekly',
        recurrencePattern: { type: 'monthly', dayOfMonth: 15 },
        startDate: '2026-03-02T10:00:00.000Z',
      };

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(500);
    });
  });

  // ==================== GET SINGLE EVENT TESTS ====================

  describe('GET /api/groups/:groupId/calendar-events/:calendarEventId', () => {
    let createdEventId: string;

    beforeAll(async () => {
      const eventData = createCalendarEventFixture();
      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);
      createdEventId = response.body.id;
    });

    it('should get existing event successfully', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdEventId);
      expect(response.body.title).toBeDefined();
    });

    it('should get event with recurrencePattern', async () => {
      const eventData = createCalendarEventFixture({
        iterationType: 'weekly',
        recurrencePattern: { type: 'weekly', dayOfWeek: 1 },
      });

      const createResponse = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      const getResponse = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events/${createResponse.body.id}`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.recurrencePattern).toEqual(eventData.recurrencePattern);
    });

    it('should get event without description', async () => {
      const eventData = {
        title: 'Event without description',
        iterationType: 'oneTime',
        startDate: '2026-06-15T10:00:00.000Z',
      };

      const createResponse = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      const getResponse = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events/${createResponse.body.id}`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.description).toBeUndefined();
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events/${fakeId}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid calendarEventId', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events/invalid-uuid`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid groupId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request
        .get(`${API_PREFIX}/invalid-uuid/calendar-events/${fakeId}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 404 for event in another group (IDOR)', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const eventData = createCalendarEventFixture();
      const createResponse = await request
        .post(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(nonMember.authToken))
        .send(eventData);

      const getResponse = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events/${createResponse.body.id}`)
        .set(createAuthHeaders(owner.authToken));

      expect(getResponse.status).toBe(404);
    });
  });

  // ==================== GET LIST OF EVENTS TESTS ====================

  describe('GET /api/groups/:groupId/calendar-events', () => {
    let eventIds: string[] = [];

    beforeAll(async () => {
      // Clean up existing events
      await postgres.query('DELETE FROM calendar_events WHERE group_id = $1', [groupId]);
      
      const events = [
        createCalendarEventFixture({
          title: 'Event 1',
          eventType: 'birthday',
          startDate: '2026-01-15T10:00:00.000Z',
        }),
        createCalendarEventFixture({
          title: 'Event 2',
          eventType: 'vacation',
          startDate: '2026-03-20T10:00:00.000Z',
        }),
        createCalendarEventFixture({
          title: 'Event 3',
          eventType: 'holiday',
          startDate: '2026-06-10T10:00:00.000Z',
        }),
        createCalendarEventFixture({
          title: 'Event 4',
          eventType: 'birthday',
          startDate: '2026-09-05T10:00:00.000Z',
        }),
        createCalendarEventFixture({
          title: 'Weekly Event',
          iterationType: 'weekly',
          recurrencePattern: { type: 'weekly', dayOfWeek: 1 },
          startDate: '2026-03-02T10:00:00.000Z',
        }),
      ];

      for (const eventData of events) {
        const response = await request
          .post(`${API_PREFIX}/${groupId}/calendar-events`)
          .set(createAuthHeaders(owner.authToken))
          .send(eventData);
        eventIds.push(response.body.id);
      }
    });

    afterAll(() => {
      eventIds = [];
    });

    it('should get all events without filters', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(5);
    });

    it('should filter events by eventType', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events?eventType=birthday`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((event: any) => {
        expect(event.type).toBe('birthday');
      });
    });

    it('should filter events by period (startDate and endDate)', async () => {
      const response = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events?startDate=2026-03-01T00:00:00.000Z&endDate=2026-06-30T23:59:59.999Z`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const startDate = new Date('2026-03-01T00:00:00.000Z').getTime();
      const endDate = new Date('2026-06-30T23:59:59.999Z').getTime();
      response.body.forEach((event: any) => {
        const eventDate = new Date(event.startDate).getTime();
        expect(eventDate).toBeGreaterThanOrEqual(startDate);
        expect(eventDate).toBeLessThanOrEqual(endDate);
      });
    });

    it('should filter events by startDate only', async () => {
      const response = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events?startDate=2026-06-01T00:00:00.000Z`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const startDate = new Date('2026-06-01T00:00:00.000Z').getTime();
      response.body.forEach((event: any) => {
        const eventDate = new Date(event.startDate).getTime();
        expect(eventDate).toBeGreaterThanOrEqual(startDate);
      });
    });

    it('should filter events by endDate only', async () => {
      const response = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events?endDate=2026-04-01T00:00:00.000Z`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const endDate = new Date('2026-04-01T00:00:00.000Z').getTime();
      response.body.forEach((event: any) => {
        const eventDate = new Date(event.startDate).getTime();
        expect(eventDate).toBeLessThanOrEqual(endDate);
      });
    });

    it('should filter events by eventType and period combined', async () => {
      const response = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events?eventType=birthday&startDate=2026-01-01T00:00:00.000Z&endDate=2026-12-31T23:59:59.999Z`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((event: any) => {
        expect(event.type).toBe('birthday');
      });
    });

    it('should return empty array when no events match filters', async () => {
      const response = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events?eventType=holiday&startDate=2020-01-01T00:00:00.000Z&endDate=2020-12-31T23:59:59.999Z`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return empty array when group has no events', async () => {
      const newGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const response = await request
        .get(`${API_PREFIX}/${newGroup}/calendar-events`)
        .set(createAuthHeaders(nonMember.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 422 for invalid startDate format', async () => {
      const response = await request
        .get(
          `${API_PREFIX}/${groupId}/calendar-events?startDate=invalid-date`,
        )
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid groupId', async () => {
      const response = await request
        .get(`${API_PREFIX}/invalid-uuid/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 404 for non-member accessing events', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const response = await request
        .get(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(404);
    });

    it('should return events sorted by startDate ASC', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      for (let i = 1; i < response.body.length; i++) {
        const prevDate = new Date(response.body[i - 1].startDate).getTime();
        const currDate = new Date(response.body[i].startDate).getTime();
        expect(prevDate).toBeLessThanOrEqual(currDate);
      }
    });
  });

  // ==================== PATCH EVENT TESTS ====================

  describe('PATCH /api/groups/:groupId/calendar-events/:calendarEventId', () => {
    let createdEventId: string;

    beforeAll(async () => {
      const eventData = createCalendarEventFixture({ title: 'Original Title' });
      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);
      createdEventId = response.body.id;
    });

    it('should update event title', async () => {
      const updateData = { title: 'Updated Title' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
    });

    it('should update event description', async () => {
      const updateData = { description: 'Updated Description' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should update both title and description', async () => {
      const updateData = { title: 'New Title', description: 'New Description' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should set description to null', async () => {
      const updateData = { description: null };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBeNull();
    });

    it('should return 422 for empty title', async () => {
      const updateData = { title: '' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(422);
    });

    it('should return 422 for title > 50 chars', async () => {
      const updateData = { title: 'a'.repeat(51) };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(422);
    });

    it('should return 422 for XSS in title', async () => {
      const updateData = { title: '<script>alert("xss")</script>' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(422);
    });

    it('should return 422 for description > 1000 chars', async () => {
      const updateData = { description: 'a'.repeat(1001) };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(422);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { title: 'Updated' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${fakeId}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(422);
    });

    it('should return 404 for event in another group (IDOR)', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const eventData = createCalendarEventFixture();
      const createResponse = await request
        .post(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(nonMember.authToken))
        .send(eventData);

      const updateData = { title: 'Hacked Title' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${createResponse.body.id}`)
        .set(createAuthHeaders(owner.authToken))
        .send(updateData);

      expect(response.status).toBe(404);
    });
  });

  // ==================== DELETE EVENT TESTS ====================

  describe('DELETE /api/groups/:groupId/calendar-events/:calendarEventId', () => {
    let createdEventId: string;

    beforeAll(async () => {
      const eventData = createCalendarEventFixture({ title: 'To Be Deleted' });
      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);
      createdEventId = response.body.id;
    });

    it('should delete existing event', async () => {
      const response = await request
        .delete(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
    });

    it('should return 404 for deleted event', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events/${createdEventId}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request
        .delete(`${API_PREFIX}/${groupId}/calendar-events/${fakeId}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid calendarEventId', async () => {
      const response = await request
        .delete(`${API_PREFIX}/${groupId}/calendar-events/invalid-uuid`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(422);
    });

    it('should return 404 for event in another group (IDOR)', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const eventData = createCalendarEventFixture();
      const createResponse = await request
        .post(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(nonMember.authToken))
        .send(eventData);

      const response = await request
        .delete(`${API_PREFIX}/${groupId}/calendar-events/${createResponse.body.id}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(404);
    });
  });

  // ==================== ACCESS CONTROL TESTS ====================

  describe('Access Control - Owner vs Member', () => {
    let memberEventId: string;

    it('should allow member to create event', async () => {
      const eventData = createCalendarEventFixture({ title: 'Member Event' });

      const response = await request
        .post(`${API_PREFIX}/${groupId}/calendar-events`)
        .set(createAuthHeaders(member.authToken))
        .send(eventData);

      expect(response.status).toBe(201);
      memberEventId = response.body.id;
    });

    it('should allow member to get event', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupId}/calendar-events/${memberEventId}`)
        .set(createAuthHeaders(member.authToken));

      expect(response.status).toBe(200);
    });

    it('should allow member to update event', async () => {
      const updateData = { title: 'Updated by Member' };

      const response = await request
        .patch(`${API_PREFIX}/${groupId}/calendar-events/${memberEventId}`)
        .set(createAuthHeaders(member.authToken))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
    });

    it('should allow member to delete event', async () => {
      const response = await request
        .delete(`${API_PREFIX}/${groupId}/calendar-events/${memberEventId}`)
        .set(createAuthHeaders(member.authToken));

      expect(response.status).toBe(200);
    });
  });

  describe('Access Control - Non-member', () => {
    it('should return 404 for non-member creating event', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const eventData = createCalendarEventFixture();

      const response = await request
        .post(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventData);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-member getting events list', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const response = await request
        .get(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-member getting single event', async () => {
      const otherGroup = await createGroupWithMember(request, nonMember, owner, postgres);

      const eventData = createCalendarEventFixture();
      const createResponse = await request
        .post(`${API_PREFIX}/${otherGroup}/calendar-events`)
        .set(createAuthHeaders(nonMember.authToken))
        .send(eventData);

      const response = await request
        .get(`${API_PREFIX}/${otherGroup}/calendar-events/${createResponse.body.id}`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(404);
    });
  });

  // ==================== DATA ISOLATION TESTS ====================

  describe('Data Isolation', () => {
    let groupA: string;
    let groupB: string;
    let eventInA: string;
    let eventInB: string;

    beforeAll(async () => {
      groupA = await createGroupWithMember(request, owner, member, postgres);
      groupB = await createGroupWithMember(request, owner, member, postgres);

      const eventA = createCalendarEventFixture({ title: 'Event in Group A' });
      const eventB = createCalendarEventFixture({ title: 'Event in Group B' });

      const responseA = await request
        .post(`${API_PREFIX}/${groupA}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventA);
      eventInA = responseA.body.id;

      const responseB = await request
        .post(`${API_PREFIX}/${groupB}/calendar-events`)
        .set(createAuthHeaders(owner.authToken))
        .send(eventB);
      eventInB = responseB.body.id;
    });

    it('should not return events from group B when querying group A', async () => {
      const response = await request
        .get(`${API_PREFIX}/${groupA}/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const hasEventFromB = response.body.some((e: any) => e.id === eventInB);
      expect(hasEventFromB).toBe(false);
    });

    it('should not affect group B events when deleting from group A', async () => {
      await request
        .delete(`${API_PREFIX}/${groupA}/calendar-events/${eventInA}`)
        .set(createAuthHeaders(owner.authToken));

      const response = await request
        .get(`${API_PREFIX}/${groupB}/calendar-events`)
        .set(createAuthHeaders(owner.authToken));

      expect(response.status).toBe(200);
      const hasEventFromB = response.body.some((e: any) => e.id === eventInB);
      expect(hasEventFromB).toBe(true);
    });
  });
});
