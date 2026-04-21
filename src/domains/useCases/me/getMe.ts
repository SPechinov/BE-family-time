import { UserId, UserPlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IGetMeUseCase {
  execute(props: DefaultProps<{ userId: UserId }>): Promise<UserPlainEntity>;
}
