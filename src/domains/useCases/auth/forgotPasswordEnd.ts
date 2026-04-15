import { UserContactsPlainEntity, UserPasswordPlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IForgotPasswordEndUseCase {
  execute(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      password: UserPasswordPlainEntity;
      otpCode: string;
    }>,
  ): Promise<void>;
}
