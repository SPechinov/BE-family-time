import { UserEntity, UserPlainCreateEntity, UserPlainFindEntity, UserPlainPatchEntity } from '@/domain/entities';

export interface IUserService {
  create(props: { userPlainCreateEntity: UserPlainCreateEntity }): Promise<UserEntity>;

  getUser(props: { userPlainFindEntity: UserPlainFindEntity }): Promise<UserEntity | null>;

  hasUser(props: { userPlainFindEntity: UserPlainFindEntity }): Promise<boolean>;

  patchUser(props: {
    userPlainFindEntity: UserPlainFindEntity;
    userPlainPatchEntity: UserPlainPatchEntity;
  }): Promise<UserEntity | null>;

  comparePasswords(passwordPlain: string, passwordHashed: string): boolean;
}
