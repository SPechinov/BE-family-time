import { UserContactsPlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IForgotPasswordStartUseCase {
  execute(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
    }>,
  ): Promise<{ otpCode: string }>;
}
