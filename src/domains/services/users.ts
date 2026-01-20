import { UserCreatePlainEntity, UserEntity, UserFindOnePlainEntity } from '@/entities';

export interface IUsersService {
  create(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity>;
  findUser(props: { userFindOnePlainEntity: UserFindOnePlainEntity }): Promise<UserEntity | null>;
}
