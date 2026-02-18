import {
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserHashedEntity,
  UserPatchOnePlainEntity,
  UserPlainEntity,
} from '@/entities';
import { ILogger } from '@/pkg';

export interface IUsersService {
  createOne(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserHashedEntity>;
  findOne(props: { userFindOnePlainEntity: UserFindOnePlainEntity }): Promise<UserHashedEntity | null>;
  patchOne(props: {
    userFindOnePlainEntity: UserFindOnePlainEntity;
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
  }): Promise<UserHashedEntity>;
  decryptUser(userEntity: UserHashedEntity): Promise<UserPlainEntity>;
  verifyPassword(props: { password: string; hash: string; logger: ILogger }): Promise<boolean>;
}
