import { UserCreatePlainEntity } from '@/entities';
import { FastifyBaseLogger } from 'fastify';

export interface IAuthUseCases {
  registrationStart(props: { userCreatePlainEntity: UserCreatePlainEntity; logger: FastifyBaseLogger }): Promise<void>;
}
