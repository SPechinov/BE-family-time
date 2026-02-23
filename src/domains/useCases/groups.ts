import { UUID } from 'node:crypto';
import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  GroupWithUsersEntity,
  UserPlainEntity,
} from '@/entities';
import { DefaultProps } from './types';

export interface IGroupsUseCases {
  findUserGroupsList(
    props: DefaultProps<{ userId: UUID }>,
  ): Promise<{ group: GroupWithUsersEntity; users: { isOwner: boolean; user: UserPlainEntity }[] }[]>;
  createUserGroup(props: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
  findUserGroup(props: DefaultProps<{ userId: UUID; groupFindOneEntity: GroupFindOneEntity }>): Promise<GroupEntity>;
  patchUserGroup(
    props: DefaultProps<{
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
}
