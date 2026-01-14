import { UserCreateEntity, UserEntity, UserFindEntity, UserPatchEntity } from '@/domain/entities';

export interface IUsersRepository {
  create(userCreateEntity: UserCreateEntity): Promise<UserEntity>;

  findOne(userFindEntity: UserFindEntity): Promise<UserEntity | null>;

  patch(props: { userFindEntity: UserFindEntity; userPatchEntity: UserPatchEntity }): Promise<UserEntity | null>;
}
