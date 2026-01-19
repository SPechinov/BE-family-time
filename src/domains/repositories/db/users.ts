import { UserCreateEntity, UserEntity, UserFindOneEntity } from '@/entities';

export interface IUsersRepository {
  create(userCreateEntity: UserCreateEntity): Promise<UserEntity>;
  findOne(userFindOneEntity: UserFindOneEntity): Promise<UserEntity | null>;
}
