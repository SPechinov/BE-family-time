import { UserCreateEntity, UserEntity } from '@/domain/entities';

export interface IUsersRepository {
  create(userCreateEntity: UserCreateEntity): Promise<UserEntity>;
}
