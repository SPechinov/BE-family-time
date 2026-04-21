import { GroupEntity, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IListUserGroupsUseCase {
  findUserGroupsList(props: DefaultProps<{ userId: UserId }>): Promise<GroupEntity[]>;
}
