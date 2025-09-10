import { UserContactsPlainEntity, UserPlainCreateEntity } from '@/domain/entities';
import { FastifyBaseLogger } from 'fastify';

export interface IAuthUseCases {
  registrationBegin(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<void>;

  registrationEnd(props: {
    userPlainCreateEntity: UserPlainCreateEntity;
    code: string;
    logger: FastifyBaseLogger;
  }): Promise<void>;
}
