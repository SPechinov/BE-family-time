import { UserCreateEntity, UserEntity, UserFindOneEntity, UserPatchOneEntity } from '@/entities';

export interface IUsersRepository {
  createOne(userCreateEntity: UserCreateEntity): Promise<UserEntity>;
  findOne(userFindEntity: UserFindOneEntity): Promise<UserEntity | null>;
  patchOne(props: {
    userFindOneEntity: UserFindOneEntity;
    userPatchOneEntity: UserPatchOneEntity;
  }): Promise<UserEntity>;
}
