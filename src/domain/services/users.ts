import { UserEntity, UserPlainCreateEntity } from '@/domain/entities';

export interface IUserService {
  create(props: { userPlainCreateEntity: UserPlainCreateEntity }): Promise<UserEntity>;
}
