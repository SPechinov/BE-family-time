import { UserCreateEntity, UserFindOneEntity, UserEntity, UserPatchOneEntity } from '@/entities';
import { IBaseRepository } from './baseRepository';

export interface IUsersRepository extends IBaseRepository {
  createOne(userCreateEntity: UserCreateEntity): Promise<UserEntity>;
  findOne(userFindEntity: UserFindOneEntity): Promise<UserEntity | null>;
  patchOne(props: {
    userFindOneEntity: UserFindOneEntity;
    userPatchOneEntity: UserPatchOneEntity;
  }): Promise<UserEntity>;
}
