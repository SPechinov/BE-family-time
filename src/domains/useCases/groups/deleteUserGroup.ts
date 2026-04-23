import { GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IDeleteUserGroupUseCase {
  execute(props: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<void>;
}
