import { GroupEntity, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IListUserGroupsUseCase {
  execute(props: DefaultProps<{ userId: UserId }>): Promise<GroupEntity[]>;
}
