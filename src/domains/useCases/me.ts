import { UserEntity } from '@/entities';

export interface IMeUseCases {
  getMe(props: { userId: string }): Promise<UserEntity>;
}
