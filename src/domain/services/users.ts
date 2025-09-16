import { UserEntity, UserPlainCreateEntity, UserPlainFindEntity } from '@/domain/entities';

export interface IUserService {
  create(props: { userPlainCreateEntity: UserPlainCreateEntity }): Promise<UserEntity>;

  getUser(props: { userPlainFindEntity: UserPlainFindEntity }): Promise<UserEntity | null>;

  hasUser(props: { userPlainFindEntity: UserPlainFindEntity }): Promise<boolean>;
}
