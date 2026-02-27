import { GroupCreateEntity, GroupEntity, GroupId, GroupPatchOneEntity, UserId } from '@/entities';
import { DefaultProps } from './types';

export interface IGroupsUseCases {
  findUserGroupsList(props: DefaultProps<{ userId: UserId }>): Promise<GroupEntity[]>;
  createUserGroup(props: DefaultProps<{ userId: UserId; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
  findUserGroup(props: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<GroupEntity>;
  patchUserGroup(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
  inviteUserInGroup(
    props: DefaultProps<{ targetUserId: UserId; actorUserId: UserId; groupId: GroupId }>,
  ): Promise<void>;
  excludeUserFromGroup(
    props: DefaultProps<{ targetUserId: UserId; actorUserId: UserId; groupId: GroupId }>,
  ): Promise<void>;
  deleteUserGroup(props: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<void>;
}
