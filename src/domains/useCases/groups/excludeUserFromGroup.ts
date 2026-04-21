import { GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IExcludeUserFromGroupUseCase {
  excludeUserFromGroup(
    props: DefaultProps<{ targetUserId: UserId; actorUserId: UserId; groupId: GroupId }>,
  ): Promise<void>;
}
