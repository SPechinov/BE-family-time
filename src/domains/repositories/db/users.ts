import { UserCreateEntity, UserFindOneEntity, UserHashedEntity, UserPatchOneEntity } from '@/entities';

export interface IUsersRepository {
  createOne(userCreateEntity: UserCreateEntity): Promise<UserHashedEntity>;
  findOne(userFindEntity: UserFindOneEntity): Promise<UserHashedEntity | null>;
  patchOne(props: {
    userFindOneEntity: UserFindOneEntity;
    userPatchOneEntity: UserPatchOneEntity;
  }): Promise<UserHashedEntity>;
}
