import { UserCreateEntity, UserEntity } from '@/domain/entities';

export interface IUserRepository {
  create(userCreateEntity: UserCreateEntity): Promise<UserEntity>;
}
