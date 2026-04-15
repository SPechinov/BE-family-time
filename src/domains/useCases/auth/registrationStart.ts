import { UserContactsPlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IRegistrationStartUseCase {
  execute(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
    }>,
  ): Promise<{ otpCode: string }>;
}
