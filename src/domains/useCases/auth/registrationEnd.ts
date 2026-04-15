import { UserCreatePlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IRegistrationEndUseCase {
  execute(
    props: DefaultProps<{
      userCreatePlainEntity: UserCreatePlainEntity;
      otpCode: string;
    }>,
  ): Promise<void>;
}
