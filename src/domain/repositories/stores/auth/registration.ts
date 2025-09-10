import { UserContactsPlainEntity } from '@/domain/entities';

export interface IAuthRegistrationStore {
  saveRegistrationCode(props: { userContactsPlain: UserContactsPlainEntity; code: string }): Promise<void>;

  getRegistrationCode(props: { userContactsPlain: UserContactsPlainEntity }): Promise<string | null>;

  deleteRegistrationCode(props: { userContactsPlain: UserContactsPlainEntity }): Promise<number>;
}
