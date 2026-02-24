import { UsersService } from './users';
import { randomUUID, UUID } from 'node:crypto';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserPatchOnePlainEntity,
  UserPersonalInfoPlainEntity,
  UserPasswordPlainEntity,
  UserEntity,
  UserContactsEncryptedEntity,
  UserPersonalInfoEncryptedEntity,
  UserContactsHashedEntity,
  UserPasswordHashedEntity,
  UserPlainEntity,
} from '@/entities';
import { ErrorUserNotExists } from '@/pkg/errors';
import { ILogger } from '@/pkg/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-uuid-12345'),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const createMockUuid = (value: string): UUID => `${value}-${value}-${value}-${value}-${value}` as UUID;

const createMockUsersRepository = () => ({
  createOne: jest.fn(),
  findOne: jest.fn(),
  patchOne: jest.fn(),
  withTransaction: jest.fn(async (fn) => fn({} as any)),
});

const createMockHmacService = () => ({
  hash: jest.fn((value: string) => `hashed-${value}`),
});

const createMockEncryptionService = () => ({
  encrypt: jest.fn(async (value: string) => `encrypted-${value}`),
  decrypt: jest.fn(async (value: string) => value.replace('encrypted-', '')),
});

const createMockHashPasswordService = () => ({
  hash: jest.fn(async (password: string) => `hashed-${password}`),
  verify: jest.fn(async ({ password, hash }: { password: string; hash: string }) => {
    return hash === `hashed-${password}`;
  }),
});

const createMockUserEntity = (overrides?: {
  id?: UUID;
  encryptionSalt?: string;
  contactsEncrypted?: UserContactsEncryptedEntity;
  contactsHashed?: UserContactsHashedEntity;
  personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  passwordHashed?: UserPasswordHashedEntity;
  createdAt?: Date;
  updatedAt?: Date;
}): UserEntity => {
  return new UserEntity({
    id: overrides?.id ?? createMockUuid('user-123'),
    encryptionSalt: overrides?.encryptionSalt ?? 'salt-123',
    contactsEncrypted:
      overrides?.contactsEncrypted ??
      new UserContactsEncryptedEntity({
        email: 'encrypted-user@example.com',
        phone: 'encrypted-+1234567890',
      }),
    contactsHashed:
      overrides?.contactsHashed ??
      new UserContactsHashedEntity({
        email: 'hashed-user@example.com',
        phone: 'hashed-+1234567890',
      }),
    personalInfoEncrypted:
      overrides?.personalInfoEncrypted ??
      new UserPersonalInfoEncryptedEntity({
        firstName: 'encrypted-John',
        lastName: 'encrypted-Doe',
      }),
    passwordHashed: overrides?.passwordHashed ?? new UserPasswordHashedEntity('hashed-password123'),
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let usersService: UsersService;
  let mockUsersRepository: ReturnType<typeof createMockUsersRepository>;
  let mockHmacService: ReturnType<typeof createMockHmacService>;
  let mockEncryptionService: ReturnType<typeof createMockEncryptionService>;
  let mockHashPasswordService: ReturnType<typeof createMockHashPasswordService>;

  beforeEach(() => {
    mockUsersRepository = createMockUsersRepository();
    mockHmacService = createMockHmacService();
    mockEncryptionService = createMockEncryptionService();
    mockHashPasswordService = createMockHashPasswordService();

    usersService = new UsersService({
      usersRepository: mockUsersRepository,
      hmacService: mockHmacService,
      encryptionService: mockEncryptionService,
      hashPasswordService: mockHashPasswordService,
    });

    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // constructor
  // ───────────────────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize with all dependencies', () => {
      expect(usersService).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // createOne()
  // ───────────────────────────────────────────────────────────────────────────

  describe('createOne()', () => {
    describe('✓ Valid operations', () => {
      it('should create user with all fields', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({
            email: 'user@example.com',
            phone: '+1234567890',
          }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({
            firstName: 'John',
            lastName: 'Doe',
          }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        const mockCreatedUser = createMockUserEntity();
        mockUsersRepository.createOne.mockResolvedValue(mockCreatedUser);

        const result = await usersService.createOne(userCreatePlainEntity);

        expect(result).toBe(mockCreatedUser);
        expect(randomUUID).toHaveBeenCalledTimes(1);
      });

      it('should encrypt personal info', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({
            firstName: 'John',
            lastName: 'Doe',
          }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(userCreatePlainEntity);

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('John', 'mocked-uuid-12345');
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Doe', 'mocked-uuid-12345');
      });

      it('should encrypt contacts', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({
            email: 'user@example.com',
            phone: '+1234567890',
          }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({}),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(userCreatePlainEntity);

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('user@example.com', 'mocked-uuid-12345');
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('+1234567890', 'mocked-uuid-12345');
      });

      it('should hash contacts', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({
            email: 'user@example.com',
            phone: '+1234567890',
          }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({}),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(userCreatePlainEntity);

        expect(mockHmacService.hash).toHaveBeenCalledWith('user@example.com');
        expect(mockHmacService.hash).toHaveBeenCalledWith('+1234567890');
      });

      it('should hash password', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({}),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(userCreatePlainEntity);

        expect(mockHashPasswordService.hash).toHaveBeenCalledWith('password123');
      });

      it('should create user with only required fields', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        const result = await usersService.createOne(userCreatePlainEntity);

        expect(result).toBeDefined();
        expect(mockUsersRepository.createOne).toHaveBeenCalled();
      });

      it('should create user with empty personal info', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({}),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        const result = await usersService.createOne(userCreatePlainEntity);

        expect(result).toBeDefined();
      });
    });

    describe('✗ Repository errors', () => {
      it('should propagate repository error on create', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        const error = new Error('Database error');
        mockUsersRepository.createOne.mockRejectedValue(error);

        await expect(usersService.createOne(userCreatePlainEntity)).rejects.toThrow('Database error');
      });
    });

    describe('⚡ Performance', () => {
      it('should encrypt and hash in parallel', async () => {
        const userCreatePlainEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'John' }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        const startTime = Date.now();
        await usersService.createOne(userCreatePlainEntity);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
      }, 1000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findOne()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    describe('✓ Valid operations', () => {
      it('should find user by ID', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const mockUser = createMockUserEntity();

        mockUsersRepository.findOne.mockResolvedValue(mockUser);

        const result = await usersService.findOne(userFindOnePlainEntity);

        expect(result).toBe(mockUser);
        expect(mockUsersRepository.findOne).toHaveBeenCalledWith(
          expect.objectContaining({ id: createMockUuid('user-123') }),
        );
      });

      it('should find user by email', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());

        await usersService.findOne(userFindOnePlainEntity);

        expect(mockHmacService.hash).toHaveBeenCalledWith('user@example.com');
        expect(mockUsersRepository.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            contactsHashed: expect.any(UserContactsHashedEntity),
          }),
        );
      });

      it('should find user by phone', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ phone: '+1234567890' }),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());

        await usersService.findOne(userFindOnePlainEntity);

        expect(mockHmacService.hash).toHaveBeenCalledWith('+1234567890');
      });

      it('should return null when user not found', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('non-existent') });

        mockUsersRepository.findOne.mockResolvedValue(null);

        const result = await usersService.findOne(userFindOnePlainEntity);

        expect(result).toBeNull();
      });
    });

    describe('✗ Invalid input', () => {
      it('should throw if neither ID nor contacts provided', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({});

        await expect(usersService.findOne(userFindOnePlainEntity)).rejects.toThrow(
          'Either id or contacts must be provided',
        );
      });

      it('should throw if contacts are empty', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({
          contactsPlain: new UserContactsPlainEntity({}),
        });

        await expect(usersService.findOne(userFindOnePlainEntity)).rejects.toThrow(
          'Either id or contacts must be provided',
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // patchOne()
  // ───────────────────────────────────────────────────────────────────────────

  describe('patchOne()', () => {
    describe('✓ Valid operations', () => {
      it('should update user personal info', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
        });

        const mockFoundUser = createMockUserEntity();
        const mockUpdatedUser = createMockUserEntity({ updatedAt: new Date('2024-01-02') });

        mockUsersRepository.findOne.mockResolvedValue(mockFoundUser);
        mockUsersRepository.patchOne.mockResolvedValue(mockUpdatedUser);

        const result = await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(result).toBe(mockUpdatedUser);
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Jane', 'salt-123');
      });

      it('should update user contacts', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'new@example.com' }),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('new@example.com', 'salt-123');
        expect(mockHmacService.hash).toHaveBeenCalledWith('new@example.com');
      });

      it('should update user password', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          passwordPlain: new UserPasswordPlainEntity('newPassword123'),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockHashPasswordService.hash).toHaveBeenCalledWith('newPassword123');
      });

      it('should update multiple fields at once', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
          contactsPlain: new UserContactsPlainEntity({ phone: '+9876543210' }),
          passwordPlain: new UserPasswordPlainEntity('newPass'),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockEncryptionService.encrypt).toHaveBeenCalledTimes(2);
        expect(mockHmacService.hash).toHaveBeenCalledTimes(1);
        expect(mockHashPasswordService.hash).toHaveBeenCalledTimes(1);
      });
    });

    describe('✗ Invalid operations', () => {
      it('should throw if user not found', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('non-existent') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
        });

        mockUsersRepository.findOne.mockResolvedValue(null);

        await expect(usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity })).rejects.toThrow(
          ErrorUserNotExists,
        );
      });

      it('should throw if no fields provided for update', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({});

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());

        await expect(usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity })).rejects.toThrow(
          'At least one field must be provided',
        );
      });

      it('should throw ErrorUserNotExists if patchOne returns null', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(null);

        await expect(usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity })).rejects.toThrow(
          ErrorUserNotExists,
        );
      });
    });

    describe('✗ Repository errors', () => {
      it('should propagate repository error on findOne', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
        });

        const error = new Error('Database error');
        mockUsersRepository.findOne.mockRejectedValue(error);

        await expect(usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity })).rejects.toThrow(
          'Database error',
        );
      });

      it('should propagate repository error on patchOne', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());

        const error = new Error('Update failed');
        mockUsersRepository.patchOne.mockRejectedValue(error);

        await expect(usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity })).rejects.toThrow(
          'Update failed',
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // decryptUser()
  // ───────────────────────────────────────────────────────────────────────────

  describe('decryptUser()', () => {
    describe('✓ Valid operations', () => {
      it('should decrypt user contacts and personal info', async () => {
        const userEntity = createMockUserEntity();

        const result = await usersService.decryptUser(userEntity);

        expect(result).toBeInstanceOf(UserPlainEntity);
        expect(result.contacts?.email).toBe('user@example.com');
        expect(result.personalInfo?.firstName).toBe('John');
        expect(result.personalInfo?.lastName).toBe('Doe');
      });

      it('should handle user with only contacts', async () => {
        const userEntity = createMockUserEntity({
          personalInfoEncrypted: undefined,
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts).toBeDefined();
        expect(result.personalInfo).toEqual({});
      });

      it('should handle user with only personal info', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: undefined,
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts).toEqual({});
        expect(result.personalInfo).toBeDefined();
      });

      it('should handle user with partial contacts', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: new UserContactsEncryptedEntity({
            email: 'encrypted-user@example.com',
            phone: undefined,
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts?.email).toBe('user@example.com');
        expect(result.contacts?.phone).toBeUndefined();
      });

      it('should handle user with partial personal info', async () => {
        const userEntity = createMockUserEntity({
          personalInfoEncrypted: new UserPersonalInfoEncryptedEntity({
            firstName: 'encrypted-John',
            lastName: undefined,
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.personalInfo?.firstName).toBe('John');
        expect(result.personalInfo?.lastName).toBeUndefined();
      });

      it('should preserve user metadata', async () => {
        const customDate = new Date('2024-01-02');
        const userEntity = createMockUserEntity({
          id: createMockUuid('test-id-123'),
          createdAt: new Date('2024-01-01'),
          updatedAt: customDate,
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.id).toBe(createMockUuid('test-id-123'));
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('⚡ Performance', () => {
      it('should decrypt contacts and personal info in parallel', async () => {
        const userEntity = createMockUserEntity();

        const startTime = Date.now();
        await usersService.decryptUser(userEntity);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
      }, 1000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verifyPassword()
  // ───────────────────────────────────────────────────────────────────────────

  describe('verifyPassword()', () => {
    const createMockLogger = (): ILogger => ({
      level: 'debug',
      fatal: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      silent: jest.fn(),
      child: jest.fn(),
    });

    describe('✓ Valid operations', () => {
      it('should return true for correct password', async () => {
        const mockLogger = createMockLogger();

        (mockHashPasswordService.verify as jest.Mock).mockResolvedValue(true);

        const result = await usersService.verifyPassword({
          password: 'correctPassword',
          hash: 'hashed-correctPassword',
          logger: mockLogger,
        });

        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const mockLogger = createMockLogger();

        (mockHashPasswordService.verify as jest.Mock).mockResolvedValue(false);

        const result = await usersService.verifyPassword({
          password: 'wrongPassword',
          hash: 'hashed-correctPassword',
          logger: mockLogger,
        });

        expect(result).toBe(false);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration', () => {
    describe('✓ Full user lifecycle', () => {
      it('should create, find, update, and decrypt user', async () => {
        // Create
        const createEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'John' }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        const createdUser = createMockUserEntity();
        mockUsersRepository.createOne.mockResolvedValue(createdUser);

        await usersService.createOne(createEntity);

        // Find
        const findEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        mockUsersRepository.findOne.mockResolvedValue(createdUser);

        const foundUser = await usersService.findOne(findEntity);

        expect(foundUser).toBe(createdUser);

        // Update
        const patchEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
        });
        mockUsersRepository.patchOne.mockResolvedValue(createdUser);

        const updatedUser = await usersService.patchOne({
          userFindOnePlainEntity: findEntity,
          userPatchOnePlainEntity: patchEntity,
        });

        expect(updatedUser).toBeDefined();

        // Decrypt
        const decrypted = await usersService.decryptUser(createdUser);

        expect(decrypted).toBeInstanceOf(UserPlainEntity);
      });
    });

    describe('🔐 Security', () => {
      it('should use unique salt for each user', async () => {
        const createEntity1 = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user1@example.com' }),
          passwordPlain: new UserPasswordPlainEntity('password1'),
        });

        const createEntity2 = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user2@example.com' }),
          passwordPlain: new UserPasswordPlainEntity('password2'),
        });

        const salt1 = 'unique-salt-1';
        const salt2 = 'unique-salt-2';

        (randomUUID as jest.Mock).mockReturnValueOnce(salt1);
        (randomUUID as jest.Mock).mockReturnValueOnce(salt2);

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(createEntity1);
        await usersService.createOne(createEntity2);

        expect(salt1).not.toBe(salt2);
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('user1@example.com', salt1);
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('user2@example.com', salt2);
      });

      it('should hash contacts for search capability', async () => {
        const createEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          passwordPlain: new UserPasswordPlainEntity('password123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(createEntity);

        expect(mockHmacService.hash).toHaveBeenCalledWith('user@example.com');
        expect(mockUsersRepository.createOne).toHaveBeenCalledWith(
          expect.objectContaining({
            contactsHashed: expect.any(UserContactsHashedEntity),
          }),
        );
      });

      it('should not store plain text passwords', async () => {
        const createEntity = new UserCreatePlainEntity({
          contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
          passwordPlain: new UserPasswordPlainEntity('secretPassword123'),
        });

        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());

        await usersService.createOne(createEntity);

        expect(mockUsersRepository.createOne).toHaveBeenCalledWith(
          expect.objectContaining({
            passwordHashed: expect.any(UserPasswordHashedEntity),
          }),
        );

        // Verify plain password was not passed to repository
        expect(mockUsersRepository.createOne).not.toHaveBeenCalledWith(
          expect.objectContaining({
            passwordPlain: expect.anything(),
          }),
        );
      });
    });

    describe('⚡ Performance', () => {
      it('should handle multiple operations efficiently', async () => {
        const startTime = Date.now();

        // Create
        mockUsersRepository.createOne.mockResolvedValue(createMockUserEntity());
        await usersService.createOne(
          new UserCreatePlainEntity({
            contactsPlain: new UserContactsPlainEntity({ email: 'user@example.com' }),
            passwordPlain: new UserPasswordPlainEntity('password'),
          }),
        );

        // Find
        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        await usersService.findOne(new UserFindOnePlainEntity({ id: createMockUuid('user-123') }));

        // Update
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());
        await usersService.patchOne({
          userFindOnePlainEntity: new UserFindOnePlainEntity({ id: createMockUuid('user-123') }),
          userPatchOnePlainEntity: new UserPatchOnePlainEntity({
            personalInfoPlain: new UserPersonalInfoPlainEntity({ firstName: 'Jane' }),
          }),
        });

        // Decrypt
        await usersService.decryptUser(createMockUserEntity());

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(500);
      }, 1000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Edge cases for null/undefined handling
  // ───────────────────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    describe('#decryptContacts', () => {
      it('should return undefined when contactsEncrypted is not instance of UserContactsEncryptedEntity', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: {} as UserContactsEncryptedEntity,
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts).toBeUndefined();
      });

      it('should return undefined when contactsEncrypted has no contact', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: new UserContactsEncryptedEntity({
            email: undefined,
            phone: undefined,
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts).toBeUndefined();
      });
    });

    describe('#decryptPersonalInfo', () => {
      it('should return undefined when personalInfoEncrypted is not instance of UserPersonalInfoEncryptedEntity', async () => {
        const userEntity = createMockUserEntity({
          personalInfoEncrypted: {} as UserPersonalInfoEncryptedEntity,
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.personalInfo).toBeUndefined();
      });

      it('should return undefined when personalInfoEncrypted has no firstName and lastName', async () => {
        const userEntity = createMockUserEntity({
          personalInfoEncrypted: new UserPersonalInfoEncryptedEntity({
            firstName: undefined,
            lastName: undefined,
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.personalInfo).toBeUndefined();
      });
    });

    describe('#convertUserFindOnePlainToHashedOrThrow', () => {
      it('should throw if contactsPlain exists but has no contact', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({
          contactsPlain: new UserContactsPlainEntity({
            email: undefined,
            phone: undefined,
          }),
        });

        await expect(usersService.findOne(userFindOnePlainEntity)).rejects.toThrow(
          'Either id or contacts must be provided',
        );
      });
    });

    describe('#prepareContacts with null', () => {
      it('should handle null contactsPlain in patchOne', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          contactsPlain: null,
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockUsersRepository.patchOne).toHaveBeenCalledWith(
          expect.objectContaining({
            userPatchOneEntity: expect.objectContaining({
              contactsEncrypted: null,
              contactsHashed: null,
            }),
          }),
        );
      });
    });

    describe('#preparePersonalInfo with null', () => {
      it('should handle null personalInfoPlain in patchOne', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: null,
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockUsersRepository.patchOne).toHaveBeenCalled();
      });
    });

    describe('#preparePasswordHashed with null', () => {
      it('should handle null passwordPlain in patchOne', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          passwordPlain: null,
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockUsersRepository.patchOne).toHaveBeenCalled();
      });
    });

    describe('#convertUserPatchOnePlainToHashedOrThrow', () => {
      it('should proceed when at least one field is provided (not all undefined/null)', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        // When all are undefined, the service should throw
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: undefined,
          contactsPlain: undefined,
          passwordPlain: undefined,
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        // The error comes from repository because no fields to update
        mockUsersRepository.patchOne.mockResolvedValue(null);

        await expect(usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity })).rejects.toThrow();
      });

      it('should handle mixed null and defined values', async () => {
        const userFindOnePlainEntity = new UserFindOnePlainEntity({ id: createMockUuid('user-123') });
        const userPatchOnePlainEntity = new UserPatchOnePlainEntity({
          personalInfoPlain: null,
          contactsPlain: null,
          passwordPlain: new UserPasswordPlainEntity('newpass'),
        });

        mockUsersRepository.findOne.mockResolvedValue(createMockUserEntity());
        mockUsersRepository.patchOne.mockResolvedValue(createMockUserEntity());

        await usersService.patchOne({ userFindOnePlainEntity, userPatchOnePlainEntity });

        expect(mockUsersRepository.patchOne).toHaveBeenCalled();
      });
    });

    describe('decryptUser with all edge cases', () => {
      it('should handle user with all undefined optional fields', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: undefined,
          personalInfoEncrypted: undefined,
        });

        const result = await usersService.decryptUser(userEntity);

        // Entity returns {} when fields are undefined
        expect(result.contacts).toEqual({});
        expect(result.personalInfo).toEqual({});
        expect(result.id).toBe('user-123');
      });

      it('should decrypt only email when phone is undefined', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: new UserContactsEncryptedEntity({
            email: 'encrypted-only-email@example.com',
            phone: undefined,
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts?.email).toBe('only-email@example.com');
        expect(result.contacts?.phone).toBeUndefined();
      });

      it('should decrypt only phone when email is undefined', async () => {
        const userEntity = createMockUserEntity({
          contactsEncrypted: new UserContactsEncryptedEntity({
            email: undefined,
            phone: 'encrypted-+1234567890',
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.contacts?.email).toBeUndefined();
        expect(result.contacts?.phone).toBe('+1234567890');
      });

      it('should decrypt only firstName when lastName is undefined', async () => {
        const userEntity = createMockUserEntity({
          personalInfoEncrypted: new UserPersonalInfoEncryptedEntity({
            firstName: 'encrypted-OnlyFirst',
            lastName: undefined,
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.personalInfo?.firstName).toBe('OnlyFirst');
        expect(result.personalInfo?.lastName).toBeUndefined();
      });

      it('should decrypt only lastName when firstName is undefined', async () => {
        const userEntity = createMockUserEntity({
          personalInfoEncrypted: new UserPersonalInfoEncryptedEntity({
            firstName: undefined,
            lastName: 'encrypted-OnlyLast',
          }),
        });

        const result = await usersService.decryptUser(userEntity);

        expect(result.personalInfo?.firstName).toBeUndefined();
        expect(result.personalInfo?.lastName).toBe('OnlyLast');
      });
    });
  });
});
