import { ILogger } from '@/pkg';
import { UUID } from 'node:crypto';
import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';

export type DefaultProps<T extends Record<string, unknown> = Record<string, never>> = {
  logger: ILogger;
} & T;

export interface IGroupsUseCases {
  findUserGroupsList(props: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]>;
  createUserGroup(props: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity>;
  findUserGroup(props: DefaultProps<{ userId: UUID; groupFindOneEntity: GroupFindOneEntity }>): Promise<GroupEntity>;
  patchUserGroup(
    props: DefaultProps<{
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity>;
}
