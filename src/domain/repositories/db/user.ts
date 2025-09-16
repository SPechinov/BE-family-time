import { UserCreateEntity, UserEntity, UserFindEntity } from '@/domain/entities';

export interface IUsersRepository {
  create(userCreateEntity: UserCreateEntity): Promise<UserEntity>;
  findOne(userFindEntity: UserFindEntity): Promise<UserEntity | null>;
}
