import { GroupEntity, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IGetUserGroupUseCase {
  execute(props: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<GroupEntity>;
}
