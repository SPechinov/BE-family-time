import { GroupEntity, GroupId, GroupPatchOneEntity, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IPatchUserGroupUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
}
