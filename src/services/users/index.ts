import { IUsersService } from '@/domains/services';
import { UserCreatePlainEntity, UserEntity } from '@/entities';

export class UsersService implements IUsersService {
  async create(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity> {
    return new UserEntity({ id: '', createdAt: new Date(), updatedAt: new Date() });
  }
}
