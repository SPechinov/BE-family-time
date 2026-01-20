import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity } from '@/entities';
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
}
