import { ICreateUserGroupUseCase } from './createUserGroup';
import { IDeleteUserGroupUseCase } from './deleteUserGroup';
import { IExcludeUserFromGroupUseCase } from './excludeUserFromGroup';
import { IGetUserGroupUseCase } from './getUserGroup';
import { IInviteUserInGroupUseCase } from './inviteUserInGroup';
import { IListUserGroupsUseCase } from './listUserGroups';
import { IPatchUserGroupUseCase } from './patchUserGroup';

// Transitional aggregate contract until controller/bootstrap are switched
// to per-scenario use case dependencies.
export interface IGroupsUseCases
  extends IListUserGroupsUseCase,
    ICreateUserGroupUseCase,
    IGetUserGroupUseCase,
    IPatchUserGroupUseCase,
    IInviteUserInGroupUseCase,
    IExcludeUserFromGroupUseCase,
    IDeleteUserGroupUseCase {}
