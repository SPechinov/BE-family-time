import { GroupCreateEntity, GroupEntity, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ICreateUserGroupUseCase {
  createUserGroup(props: DefaultProps<{ userId: UserId; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
}
