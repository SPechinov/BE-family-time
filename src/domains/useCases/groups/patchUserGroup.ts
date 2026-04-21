import { GroupEntity, GroupId, GroupPatchOneEntity, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IPatchUserGroupUseCase {
  patchUserGroup(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
}
