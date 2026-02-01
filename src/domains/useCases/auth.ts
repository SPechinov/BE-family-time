import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity, UserPasswordPlainEntity } from '@/entities';
import { FastifyBaseLogger } from 'fastify';

export interface IAuthUseCases {
  registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<{ otpCode: string }>;

  registrationEnd(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    otpCode: string;
    logger: FastifyBaseLogger;
  }): Promise<UserEntity>;

  forgotPasswordStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<{ otpCode: string }>;

  forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    password: UserPasswordPlainEntity;
    otpCode: string;
    logger: FastifyBaseLogger;
  }): Promise<UserEntity>;
}
