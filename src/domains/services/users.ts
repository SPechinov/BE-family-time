import { UserCreatePlainEntity, UserEntity } from '@/entities';

export interface IUsersService {
  create(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity>;
}
