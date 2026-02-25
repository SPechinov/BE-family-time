import { UUID } from 'node:crypto';
import { GroupCreateEntity, GroupEntity, GroupPatchOneEntity } from '@/entities';
import { DefaultProps } from './types';

export interface IGroupsUseCases {
  findUserGroupsList(props: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]>;
  createUserGroup(props: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
  findUserGroup(props: DefaultProps<{ userId: UUID; groupId: UUID }>): Promise<GroupEntity>;
  patchUserGroup(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
  inviteUserInGroup(props: DefaultProps<{ invitingUserId: UUID; ownerUserId: UUID; groupId: UUID }>): Promise<void>;
  excludeUserFromGroup(props: DefaultProps<{ excludingUserId: UUID; ownerUserId: UUID; groupId: UUID }>): Promise<void>;
}
