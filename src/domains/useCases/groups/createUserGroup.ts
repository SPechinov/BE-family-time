import { GroupCreateEntity, GroupEntity, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ICreateUserGroupUseCase {
  execute(props: DefaultProps<{ userId: UserId; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
}
