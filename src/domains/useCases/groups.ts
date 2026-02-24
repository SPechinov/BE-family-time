import { UUID } from 'node:crypto';
import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { DefaultProps } from './types';

export interface IGroupsUseCases {
  findUserGroupsList(props: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]>;
  createUserGroup(props: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
  findUserGroup(props: DefaultProps<{ userId: UUID; groupId: UUID }>): Promise<GroupEntity>;
  patchUserGroup(
    props: DefaultProps<{
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
}
