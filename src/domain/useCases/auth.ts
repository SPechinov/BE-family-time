import { UserContactsPlainEntity } from '@/domain/entities';

export interface IAuthUseCases {
  registrationBegin(props: { userContactsPlain: UserContactsPlainEntity }): Promise<void>;
}
