import { UserContactsPlainEntity, UserPlainCreateEntity, UserPlainPatchEntity } from '@/domain/entities';
import { FastifyBaseLogger } from 'fastify';

export interface IAuthUseCases {
  login(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    passwordPlain: string;
    logger: FastifyBaseLogger;
  }): Promise<{ accessToken: string; refreshToken: string }>;

  refreshToken(props: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string }>;

  logout(props: { refreshToken: string; logger: FastifyBaseLogger }): Promise<void>;

  logoutAll(props: { userId: string; refreshToken: string; logger: FastifyBaseLogger }): Promise<void>;

  registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<void>;

  registrationEnd(props: {
    userPlainCreateEntity: UserPlainCreateEntity;
    code: string;
    logger: FastifyBaseLogger;
  }): Promise<void>;

  forgotPasswordStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<void>;

  forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    userPlainPatchEntity: UserPlainPatchEntity;
    code: string;
    logger: FastifyBaseLogger;
  }): Promise<void>;
}
