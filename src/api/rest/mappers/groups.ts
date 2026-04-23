import { GroupCreateEntity, GroupEntity, GroupPatchOneEntity } from '@/entities';

const normalizeCreateDescription = (value?: string): string | undefined => {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (normalized === '') return undefined;

  return normalized;
};

const normalizePatchDescription = (value?: string | null): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = value.trim();
  if (normalized === '') return null;

  return normalized;
};

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
    description: normalizeCreateDescription(body.description),
  });

export const toPatchGroupCommand = (body: { name?: string; description?: string | null }) =>
  new GroupPatchOneEntity({
    name: body.name,
    description: normalizePatchDescription(body.description),
  });
