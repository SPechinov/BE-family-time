import { GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IDeleteUserGroupUseCase {
  deleteUserGroup(props: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<void>;
}
