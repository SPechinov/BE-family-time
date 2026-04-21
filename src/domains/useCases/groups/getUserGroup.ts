import { GroupEntity, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IGetUserGroupUseCase {
  findUserGroup(props: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<GroupEntity>;
}
