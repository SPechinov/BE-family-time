import { UsersGroupsRepository } from './usersGroups';
import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsDeleteEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
import { Pool } from 'pg';
import { UUID } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const createMockPool = () => {
  const mockPool = {
    query: jest.fn(),
  } as unknown as Pool;

  return mockPool;
};

const createMockUuid = (value: string): UUID => {
  return `${value}-${value}-${value}-${value}-${value}` as UUID;
};

const createMockUsersGroupsEntity = (overrides?: {
  userId?: UUID;
  groupId?: UUID;
  isOwner?: boolean;
  createdAt?: Date;
}): UsersGroupsEntity => {
  return new UsersGroupsEntity({
    userId: overrides?.userId ?? createMockUuid('user-123'),
    groupId: overrides?.groupId ?? createMockUuid('group-456'),
    isOwner: overrides?.isOwner ?? false,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
  });
};

const createMockRowData = (entity: UsersGroupsEntity) => ({
  user_id: entity.userId,
  group_id: entity.groupId,
  is_owner: entity.isOwner,
  created_at: entity.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('UsersGroupsRepository', () => {
  let repository: UsersGroupsRepository;
  let mockPool: ReturnType<typeof createMockPool>;

  beforeEach(() => {
    mockPool = createMockPool();
    repository = new UsersGroupsRepository(mockPool);
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // constructor
  // ───────────────────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize with pool', () => {
      expect(repository).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // createOne()
  // ───────────────────────────────────────────────────────────────────────────

  describe('createOne()', () => {
    describe('✓ Valid operations', () => {
      it('should create users-groups relation with all fields', async () => {
        const entity = new UsersGroupsCreateEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
          isOwner: true,
        });

        const mockRow = createMockRowData(
          createMockUsersGroupsEntity({
            userId: entity.userId,
            groupId: entity.groupId,
            isOwner: entity.isOwner,
          }),
        );

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        const result = await repository.createOne(entity);

        expect(result).toBeInstanceOf(UsersGroupsEntity);
        expect(result.userId).toBe(entity.userId);
        expect(result.groupId).toBe(entity.groupId);
        expect(result.isOwner).toBe(entity.isOwner);
        expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users_groups'), [
          entity.userId,
          entity.groupId,
          entity.isOwner,
        ]);
      });

      it('should create relation with isOwner=false', async () => {
        const entity = new UsersGroupsCreateEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
          isOwner: false,
        });

        const mockRow = createMockRowData(
          createMockUsersGroupsEntity({
            userId: entity.userId,
            groupId: entity.groupId,
            isOwner: false,
          }),
        );

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        const result = await repository.createOne(entity);

        expect(result.isOwner).toBe(false);
      });

      it('should use provided client when options.client is passed', async () => {
        const mockClient = {
          query: jest.fn(),
        };

        const entity = new UsersGroupsCreateEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
          isOwner: true,
        });

        const mockRow = createMockRowData(createMockUsersGroupsEntity());
        mockClient.query.mockResolvedValue({ rows: [mockRow] });

        await repository.createOne(entity, { client: mockClient as any });

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockPool.query).not.toHaveBeenCalled();
      });
    });

    describe('✗ Invalid operations', () => {
      it('should throw error when row is not returned', async () => {
        const entity = new UsersGroupsCreateEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
          isOwner: true,
        });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

        await expect(repository.createOne(entity)).rejects.toThrow('User-Group relation not created');
      });

      it('should throw error when query fails', async () => {
        const entity = new UsersGroupsCreateEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
          isOwner: true,
        });

        const error = new Error('Database error');
        (mockPool.query as jest.Mock).mockRejectedValue(error);

        await expect(repository.createOne(entity)).rejects.toThrow('Database error');
      });
    });

    describe('⚡ SQL query', () => {
      it('should use ON CONFLICT DO UPDATE clause', async () => {
        const entity = new UsersGroupsCreateEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
          isOwner: true,
        });

        const mockRow = createMockRowData(createMockUsersGroupsEntity());
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        await repository.createOne(entity);

        const queryCall = (mockPool.query as jest.Mock).mock.calls[0][0];
        expect(queryCall).toContain('ON CONFLICT (user_id, group_id) DO UPDATE');
        expect(queryCall).toContain('SET is_owner = EXCLUDED.is_owner');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findOne()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    describe('✓ Valid operations', () => {
      it('should find relation by userId', async () => {
        const userId = createMockUuid('user-123');
        const entity = new UsersGroupsFindOneEntity({ userId });

        const mockRow = createMockRowData(createMockUsersGroupsEntity({ userId }));
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        const result = await repository.findOne(entity);

        expect(result).toBeInstanceOf(UsersGroupsEntity);
        expect(result?.userId).toBe(userId);
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE ug.user_id = $1'),
          expect.arrayContaining([userId]),
        );
      });

      it('should find relation by groupId', async () => {
        const groupId = createMockUuid('group-456');
        const entity = new UsersGroupsFindOneEntity({ groupId });

        const mockRow = createMockRowData(createMockUsersGroupsEntity({ groupId }));
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        const result = await repository.findOne(entity);

        expect(result).toBeInstanceOf(UsersGroupsEntity);
        expect(result?.groupId).toBe(groupId);
      });

      it('should find relation by userId and groupId', async () => {
        const userId = createMockUuid('user-123');
        const groupId = createMockUuid('group-456');
        const entity = new UsersGroupsFindOneEntity({ userId, groupId });

        const mockRow = createMockRowData(createMockUsersGroupsEntity({ userId, groupId }));
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        const result = await repository.findOne(entity);

        expect(result).toBeInstanceOf(UsersGroupsEntity);
        expect(result?.userId).toBe(userId);
        expect(result?.groupId).toBe(groupId);
      });

      it('should find relation by isOwner', async () => {
        const entity = new UsersGroupsFindOneEntity({ isOwner: true });

        const mockRow = createMockRowData(createMockUsersGroupsEntity({ isOwner: true }));
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

        const result = await repository.findOne(entity);

        expect(result?.isOwner).toBe(true);
        const queryCall = (mockPool.query as jest.Mock).mock.calls[0][0];
        expect(queryCall).toContain('ug.is_owner = $');
      });

      it('should return null when relation not found', async () => {
        const entity = new UsersGroupsFindOneEntity({
          userId: createMockUuid('non-existent'),
        });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await repository.findOne(entity);

        expect(result).toBeNull();
      });

      it('should return null when no conditions provided', async () => {
        const entity = new UsersGroupsFindOneEntity({});

        const result = await repository.findOne(entity);

        expect(result).toBeNull();
        expect(mockPool.query).not.toHaveBeenCalled();
      });
    });

    describe('✗ Invalid operations', () => {
      it('should propagate database error', async () => {
        const entity = new UsersGroupsFindOneEntity({
          userId: createMockUuid('user-123'),
        });

        const error = new Error('Database error');
        (mockPool.query as jest.Mock).mockRejectedValue(error);

        await expect(repository.findOne(entity)).rejects.toThrow('Database error');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findMany()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findMany()', () => {
    describe('✓ Valid operations', () => {
      it('should find many relations by userId', async () => {
        const userId = createMockUuid('user-123');
        const options = new UsersGroupsFindManyEntity({ userId });

        const mockRows = [
          createMockRowData(createMockUsersGroupsEntity({ userId })),
          createMockRowData(createMockUsersGroupsEntity({ userId, groupId: createMockUuid('group-789') })),
        ];
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

        const result = await repository.findMany(options);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(UsersGroupsEntity);
        expect(result[0].userId).toBe(userId);
      });

      it('should find many relations by groupId', async () => {
        const groupId = createMockUuid('group-456');
        const options = new UsersGroupsFindManyEntity({ groupId });

        const mockRows = [
          createMockRowData(createMockUsersGroupsEntity({ groupId })),
          createMockRowData(createMockUsersGroupsEntity({ groupId })),
        ];
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

        const result = await repository.findMany(options);

        expect(result).toHaveLength(2);
        expect(result.every((r) => r.groupId === groupId)).toBe(true);
      });

      it('should find many relations with isOwner filter', async () => {
        const options = new UsersGroupsFindManyEntity({ isOwner: true });

        const mockRows = [createMockRowData(createMockUsersGroupsEntity({ isOwner: true }))];
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

        const result = await repository.findMany(options);

        expect(result).toHaveLength(1);
        expect(result[0].isOwner).toBe(true);
      });

      it('should return empty array when no relations found', async () => {
        const options = new UsersGroupsFindManyEntity({
          userId: createMockUuid('non-existent'),
        });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

        const result = await repository.findMany(options);

        expect(result).toEqual([]);
      });

      it('should return all relations when no filters provided', async () => {
        const options = new UsersGroupsFindManyEntity({});

        const mockRows = [
          createMockRowData(createMockUsersGroupsEntity()),
          createMockRowData(createMockUsersGroupsEntity()),
        ];
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

        const result = await repository.findMany(options);

        expect(result).toHaveLength(2);
      });
    });

    describe('✗ Invalid operations', () => {
      it('should propagate database error', async () => {
        const options = new UsersGroupsFindManyEntity({
          userId: createMockUuid('user-123'),
        });

        const error = new Error('Database error');
        (mockPool.query as jest.Mock).mockRejectedValue(error);

        await expect(repository.findMany(options)).rejects.toThrow('Database error');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // count()
  // ───────────────────────────────────────────────────────────────────────────

  describe('count()', () => {
    describe('✓ Valid operations', () => {
      it('should count relations by userId', async () => {
        const userId = createMockUuid('user-123');
        const options = new UsersGroupsFindManyEntity({ userId });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '5' }] });

        const result = await repository.count(options);

        expect(result).toBe(5);
        expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT COUNT(*)'), expect.any(Array));
      });

      it('should count relations by groupId', async () => {
        const groupId = createMockUuid('group-456');
        const options = new UsersGroupsFindManyEntity({ groupId });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '10' }] });

        const result = await repository.count(options);

        expect(result).toBe(10);
      });

      it('should count relations with isOwner filter', async () => {
        const options = new UsersGroupsFindManyEntity({ isOwner: true });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '1' }] });

        const result = await repository.count(options);

        expect(result).toBe(1);
      });

      it('should return 0 when no relations found', async () => {
        const options = new UsersGroupsFindManyEntity({
          userId: createMockUuid('non-existent'),
        });

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '0' }] });

        const result = await repository.count(options);

        expect(result).toBe(0);
      });

      it('should count all relations when no filters provided', async () => {
        const options = new UsersGroupsFindManyEntity({});

        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ count: '100' }] });

        const result = await repository.count(options);

        expect(result).toBe(100);
      });
    });

    describe('✗ Invalid operations', () => {
      it('should propagate database error', async () => {
        const options = new UsersGroupsFindManyEntity({
          userId: createMockUuid('user-123'),
        });

        const error = new Error('Database error');
        (mockPool.query as jest.Mock).mockRejectedValue(error);

        await expect(repository.count(options)).rejects.toThrow('Database error');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // deleteOne()
  // ───────────────────────────────────────────────────────────────────────────

  describe('deleteOne()', () => {
    describe('✓ Valid operations', () => {
      it('should delete relation by userId and groupId', async () => {
        const userId = createMockUuid('user-123');
        const groupId = createMockUuid('group-456');
        const entity = new UsersGroupsDeleteEntity({ userId, groupId });

        (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

        await repository.deleteOne(entity);

        expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM users_groups'), [
          userId,
          groupId,
        ]);
      });

      it('should succeed even if no rows deleted', async () => {
        const entity = new UsersGroupsDeleteEntity({
          userId: createMockUuid('non-existent'),
          groupId: createMockUuid('group-456'),
        });

        (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

        await expect(repository.deleteOne(entity)).resolves.toBeUndefined();
      });
    });

    describe('✗ Invalid operations', () => {
      it('should propagate database error', async () => {
        const entity = new UsersGroupsDeleteEntity({
          userId: createMockUuid('user-123'),
          groupId: createMockUuid('group-456'),
        });

        const error = new Error('Database error');
        (mockPool.query as jest.Mock).mockRejectedValue(error);

        await expect(repository.deleteOne(entity)).rejects.toThrow('Database error');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration tests', () => {
    it('should build entity from row data correctly', () => {
      const userId = createMockUuid('user-123');
      const groupId = createMockUuid('group-456');
      const createdAt = new Date('2024-01-15T10:30:00Z');

      const rowData = {
        user_id: userId,
        group_id: groupId,
        is_owner: true,
        created_at: createdAt,
      };

      const entity = new UsersGroupsEntity({
        userId: rowData.user_id,
        groupId: rowData.group_id,
        isOwner: rowData.is_owner,
        createdAt: rowData.created_at,
      });

      expect(entity).toBeInstanceOf(UsersGroupsEntity);
      expect(entity.userId).toBe(userId);
      expect(entity.groupId).toBe(groupId);
      expect(entity.isOwner).toBe(true);
      expect(entity.createdAt).toBe(createdAt);
    });
  });
});
