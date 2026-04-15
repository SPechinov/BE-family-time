import { UserContactsPlainEntity, UserPasswordPlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface ILoginUseCase {
  execute(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      userPasswordPlainEntity: UserPasswordPlainEntity;
      userAgent: string;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }>;
}
