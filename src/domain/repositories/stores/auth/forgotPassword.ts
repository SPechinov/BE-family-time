import { UserContactsPlainEntity } from '@/domain/entities';

export interface IAuthForgotPasswordStore {
  saveCode(props: { userContactsPlain: UserContactsPlainEntity; code: string }): Promise<void>;

  getCode(props: { userContactsPlain: UserContactsPlainEntity }): Promise<string | null>;

  deleteCode(props: { userContactsPlain: UserContactsPlainEntity }): Promise<number>;
}
