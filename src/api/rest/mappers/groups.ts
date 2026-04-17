import { GroupCreateEntity, GroupEntity, GroupPatchOneEntity } from '@/entities';

export const toGroupResponse = (group: GroupEntity) => {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? '',
  };
};

export const toGroupsResponse = (groups: GroupEntity[]) => groups.map(toGroupResponse);

export const toCreateGroupCommand = (body: { name: string; description?: string }) =>
  new GroupCreateEntity({
    name: body.name,
    description: body.description ?? undefined,
  });

export const toPatchGroupCommand = (body: { name?: string; description?: string | null }) =>
  new GroupPatchOneEntity({
    name: body.name,
    description: body.description,
  });
