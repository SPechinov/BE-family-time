/**
 * Integration tests for Groups API endpoints
 * Tests cover: CRUD operations, user invitations, exclusions, ownership
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { createTestAgent, DEFAULT_HEADERS, extractAuthToken } from '../utils/test-http';
import { createUserFixture, createGroupFixture } from '../fixtures/user.fixture';
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
  if ((globalThis as any).__TEST_CONTEXT__) {
    await teardownTestEnvironment();
    (globalThis as any).__TEST_CONTEXT__ = null;
    console.log('Test environment cleaned up');
  }
});

// Cleanup after each test to isolate tests
afterEach(async () => {
  const context = globalThis.__TEST_CONTEXT__;
  // Cleanup groups after each test
  if (context?.postgres) {
    await context.postgres.query('DELETE FROM groups_users');
    await context.postgres.query('DELETE FROM groups');
  }
  // Note: Not flushing Redis to preserve auth tokens created in beforeAll
  // Each test group manages its own Redis data if needed
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const authToken = extractAuthToken(loginResponse)!;

  // Get user ID from database
  const userResult = await request.get('/api/me').set({
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${authToken}`,
  });

  return {
    authToken,
    email: user.email,
    userId: userResult.body.id,
  };
}

describe('Groups API Integration Tests', () => {
  let request: any;
  let postgres: Pool;
  let owner1: AuthTokens;
  let owner2: AuthTokens;

  beforeAll(async () => {
    const context = globalThis.__TEST_CONTEXT__;
    if (!context) {
      throw new Error('Test context not initialized. Make sure globalSetup is configured.');
    }
    request = createTestAgent(context.fastify);
    postgres = context.postgres;

    // Register two users for group tests
    owner1 = await registerAndLogin(request);
    owner2 = await registerAndLogin(request);
  });

  beforeEach(async () => {
    // Cleanup groups before each test
    await postgres.query('DELETE FROM groups_users');
    await postgres.query('DELETE FROM groups');
  });

  describe('POST /groups (Create Group)', () => {
    it('should create a new group successfully', async () => {
      const groupData = createGroupFixture();

      const response = await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({});

      // Verify group exists in database
      const groupResult = await postgres.query('SELECT id, name, description FROM groups WHERE name = $1', [
        groupData.name,
      ]);
      expect(groupResult.rows.length).toBe(1);
      expect(groupResult.rows[0].name).toBe(groupData.name);
    });

    it('should create group without description', async () => {
      const groupData = { name: createGroupFixture().name };

      const response = await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      expect(response.status).toBe(201);

      // Verify group exists
      const groupResult = await postgres.query('SELECT id, name, description FROM groups WHERE name = $1', [
        groupData.name,
      ]);
      expect(groupResult.rows.length).toBe(1);
    });

    it('should set creator as group owner', async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      // Verify owner relationship exists
      const ownerResult = await postgres.query(
        `SELECT gu.is_owner, gu.user_id 
         FROM groups_users gu 
         JOIN groups g ON g.id = gu.group_id 
         WHERE g.name = $1 AND gu.is_owner = TRUE`,
        [groupData.name],
      );

      expect(ownerResult.rows.length).toBe(1);
      expect(ownerResult.rows[0].user_id).toBe(owner1.userId);
    });

    it('should reject creation without auth token', async () => {
      const groupData = createGroupFixture();

      const response = await request.post(API_PREFIX).set(DEFAULT_HEADERS).send(groupData);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it('should reject group with name exceeding max length', async () => {
      const groupData = {
        name: 'a'.repeat(51), // Max is 50
      };

      const response = await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('statusCode');
    });

    it('should reject group with empty name', async () => {
      const groupData = { name: '' };

      const response = await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      expect(response.status).toBe(422);
    });

    it('should reject group with description exceeding max length', async () => {
      const groupData = {
        name: createGroupFixture().name,
        description: 'a'.repeat(1001), // Max is 1000
      };

      const response = await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({});
    });
  });

  describe('GET /groups (List Groups)', () => {
    it('should return list of user groups', async () => {
      const groupData = createGroupFixture();

      // Create a group
      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${owner1.authToken}`,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe(groupData.name);
    });

    it('should return empty array when user has no groups', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${owner2.authToken}`,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should reject without auth token', async () => {
      const response = await request.get(API_PREFIX).set(DEFAULT_HEADERS);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({});
    });
  });

  describe('GET /groups/:groupId (Get Group)', () => {
    let createdGroupId: string;

    beforeEach(async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      // Get group ID from database
      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      createdGroupId = groupResult.rows[0].id;
    });

    it('should return group details by ID', async () => {
      const response = await request.get(`${API_PREFIX}/${createdGroupId}`).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${owner1.authToken}`,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdGroupId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
    });

    it('should return 404 for non-existent group', async () => {
      const fakeGroupId = '00000000-0000-0000-0000-000000000000';

      const response = await request.get(`${API_PREFIX}/${fakeGroupId}`).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${owner1.authToken}`,
      });

      // API returns 422 for invalid/non-existent UUIDs
      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({});
    });

    it('should return 404 for group user is not member of', async () => {
      // Create a group owned by owner1
      const groupData = createGroupFixture();
      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      const groupId = groupResult.rows[0].id;

      // Try to access from owner2's account
      const response = await request.get(`${API_PREFIX}/${groupId}`).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${owner2.authToken}`,
      });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({});
    });

    it('should reject invalid UUID format', async () => {
      const response = await request.get(`${API_PREFIX}/invalid-uuid`).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${owner1.authToken}`,
      });

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({});
    });
  });

  describe('PATCH /groups/:groupId (Update Group)', () => {
    let createdGroupId: string;

    beforeEach(async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      createdGroupId = groupResult.rows[0].id;
    });

    it('should update group name', async () => {
      const newName = createGroupFixture().name;

      const response = await request
        .patch(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ name: newName });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(newName);

      // Verify in database
      const groupResult = await postgres.query('SELECT name FROM groups WHERE id = $1', [createdGroupId]);
      expect(groupResult.rows[0].name).toBe(newName);
    });

    it('should update group description', async () => {
      const newDescription = 'Updated description';

      const response = await request
        .patch(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ description: newDescription });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(newDescription);
    });

    it('should update both name and description', async () => {
      const newName = createGroupFixture().name;
      const newDescription = 'Updated description';

      const response = await request
        .patch(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ name: newName, description: newDescription });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(newName);
      expect(response.body.description).toBe(newDescription);
    });

    it('should reject update with empty body', async () => {
      const response = await request
        .patch(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({});

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({});
    });

    it('should reject update without auth token', async () => {
      const response = await request
        .patch(`${API_PREFIX}/${createdGroupId}`)
        .set(DEFAULT_HEADERS)
        .send({ name: 'New Name' });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it('should reject update by non-owner', async () => {
      // owner2 tries to update owner1's group
      const response = await request
        .patch(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner2.authToken}`,
        })
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({});
    });
  });

  describe('DELETE /groups/:groupId (Delete Group)', () => {
    let createdGroupId: string;

    beforeEach(async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      createdGroupId = groupResult.rows[0].id;
    });

    it('should delete group successfully', async () => {
      const response = await request
        .delete(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({});

      expect(response.status).toBe(200);
    });

    it('should delete group_users relationships on delete', async () => {
      // First invite another user
      await request
        .post(`${API_PREFIX}/${createdGroupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: owner2.userId });

      // Delete the group - should fail because group has other users
      const response = await request
        .delete(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'groupHasUsers');
    });

    it('should reject delete without auth token', async () => {
      const response = await request.delete(`${API_PREFIX}/${createdGroupId}`).set(DEFAULT_HEADERS).send({});

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it('should reject delete by non-owner', async () => {
      const response = await request
        .delete(`${API_PREFIX}/${createdGroupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner2.authToken}`,
        })
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({});
    });
  });

  describe('POST /groups/:groupId/inviteUser', () => {
    let createdGroupId: string;

    beforeEach(async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      createdGroupId = groupResult.rows[0].id;
    });

    it('should invite user to group successfully', async () => {
      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: owner2.userId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});

      // Verify invitation in database
      const guResult = await postgres.query('SELECT * FROM groups_users WHERE group_id = $1 AND user_id = $2', [
        createdGroupId,
        owner2.userId,
      ]);
      expect(guResult.rows.length).toBe(1);
      expect(guResult.rows[0].is_owner).toBe(false);
    });

    it('should reject invite without auth token', async () => {
      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/inviteUser`)
        .set(DEFAULT_HEADERS)
        .send({ targetUserId: owner2.userId });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it('should reject invite by non-owner', async () => {
      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner2.authToken}`,
        })
        .send({ targetUserId: owner1.userId });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({});
    });

    it('should reject invite with invalid user ID', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: fakeUserId });

      // API returns 422 for invalid UUID format
      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({});
    });
  });

  describe('POST /groups/:groupId/excludeUser', () => {
    let createdGroupId: string;

    beforeEach(async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      createdGroupId = groupResult.rows[0].id;

      // Invite owner2 to the group
      await request
        .post(`${API_PREFIX}/${createdGroupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: owner2.userId });
    });

    it('should exclude user from group successfully', async () => {
      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/excludeUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: owner2.userId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});

      // Verify user is excluded
      const guResult = await postgres.query('SELECT * FROM groups_users WHERE group_id = $1 AND user_id = $2', [
        createdGroupId,
        owner2.userId,
      ]);
      expect(guResult.rows.length).toBe(0);
    });

    it('should reject exclude without auth token', async () => {
      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/excludeUser`)
        .set(DEFAULT_HEADERS)
        .send({ targetUserId: owner2.userId });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({});
    });

    it('should reject exclude by non-owner', async () => {
      const response = await request
        .post(`${API_PREFIX}/${createdGroupId}/excludeUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner2.authToken}`,
        })
        .send({ targetUserId: owner1.userId });

      // API returns 400 for business logic errors (non-owner trying to exclude)
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({});
    });
  });

  describe('Authorization and Security', () => {
    it('should not allow member to update group (only owner)', async () => {
      const groupData = createGroupFixture();

      // owner1 creates group
      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      const groupId = groupResult.rows[0].id;

      // owner1 invites owner2
      await request
        .post(`${API_PREFIX}/${groupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: owner2.userId });

      // owner2 tries to update (should fail)
      const response = await request
        .patch(`${API_PREFIX}/${groupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner2.authToken}`,
        })
        .send({ name: 'Hacked' });

      // API returns 400 for business logic errors (member trying to update)
      expect(response.status).toBe(400);
    });

    it('should not allow member to delete group (only owner)', async () => {
      const groupData = createGroupFixture();

      await request
        .post(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send(groupData);

      const groupResult = await postgres.query('SELECT id FROM groups WHERE name = $1', [groupData.name]);
      const groupId = groupResult.rows[0].id;

      await request
        .post(`${API_PREFIX}/${groupId}/inviteUser`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner1.authToken}`,
        })
        .send({ targetUserId: owner2.userId });

      const response = await request
        .delete(`${API_PREFIX}/${groupId}`)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${owner2.authToken}`,
        })
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'userIsNotGroupOwner');
    });
  });
});
