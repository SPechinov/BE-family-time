import {
  ICreateUserGroupUseCase,
  IDeleteUserGroupUseCase,
  IExcludeUserFromGroupUseCase,
  IGetUserGroupUseCase,
  IGroupsUseCases,
  IInviteUserInGroupUseCase,
  IListUserGroupsUseCase,
  IPatchUserGroupUseCase,
} from '@/domains/useCases';
import { CreateUserGroupUseCase } from './createUserGroup';
import { DeleteUserGroupUseCase } from './deleteUserGroup';
import { ExcludeUserFromGroupUseCase } from './excludeUserFromGroup';
import { GetUserGroupUseCase } from './getUserGroup';
import { InviteUserInGroupUseCase } from './inviteUserInGroup';
import { ListUserGroupsUseCase } from './listUserGroups';
import { PatchUserGroupUseCase } from './patchUserGroup';
import { GroupsUseCasesDeps } from './shared/types';

// Transitional aggregate adapter for compatibility with current bootstrap/controller wiring.
// Will be removed when transport depends on per-scenario use cases directly.
export class GroupsUseCases implements IGroupsUseCases {
  readonly #listUserGroupsUseCase: IListUserGroupsUseCase;
  readonly #createUserGroupUseCase: ICreateUserGroupUseCase;
  readonly #getUserGroupUseCase: IGetUserGroupUseCase;
  readonly #patchUserGroupUseCase: IPatchUserGroupUseCase;
  readonly #inviteUserInGroupUseCase: IInviteUserInGroupUseCase;
  readonly #excludeUserFromGroupUseCase: IExcludeUserFromGroupUseCase;
  readonly #deleteUserGroupUseCase: IDeleteUserGroupUseCase;

  constructor(props: GroupsUseCasesDeps) {
    this.#listUserGroupsUseCase = new ListUserGroupsUseCase({
      usersService: props.usersService,
      groupsService: props.groupsService,
      groupsUsersService: props.groupsUsersService,
    });
    this.#createUserGroupUseCase = new CreateUserGroupUseCase(props);
    this.#getUserGroupUseCase = new GetUserGroupUseCase({
      usersService: props.usersService,
      groupsUsersService: props.groupsUsersService,
      groupsService: props.groupsService,
    });
    this.#patchUserGroupUseCase = new PatchUserGroupUseCase({
      usersService: props.usersService,
      groupsUsersService: props.groupsUsersService,
      groupsService: props.groupsService,
    });
    this.#inviteUserInGroupUseCase = new InviteUserInGroupUseCase(props);
    this.#excludeUserFromGroupUseCase = new ExcludeUserFromGroupUseCase({
      usersService: props.usersService,
      groupsUsersService: props.groupsUsersService,
    });
    this.#deleteUserGroupUseCase = new DeleteUserGroupUseCase(props);
  }

  findUserGroupsList(...args: Parameters<IListUserGroupsUseCase['findUserGroupsList']>) {
    return this.#listUserGroupsUseCase.findUserGroupsList(...args);
  }

  createUserGroup(...args: Parameters<ICreateUserGroupUseCase['createUserGroup']>) {
    return this.#createUserGroupUseCase.createUserGroup(...args);
  }

  findUserGroup(...args: Parameters<IGetUserGroupUseCase['findUserGroup']>) {
    return this.#getUserGroupUseCase.findUserGroup(...args);
  }

  patchUserGroup(...args: Parameters<IPatchUserGroupUseCase['patchUserGroup']>) {
    return this.#patchUserGroupUseCase.patchUserGroup(...args);
  }

  inviteUserInGroup(...args: Parameters<IInviteUserInGroupUseCase['inviteUserInGroup']>) {
    return this.#inviteUserInGroupUseCase.inviteUserInGroup(...args);
  }

  excludeUserFromGroup(...args: Parameters<IExcludeUserFromGroupUseCase['excludeUserFromGroup']>) {
    return this.#excludeUserFromGroupUseCase.excludeUserFromGroup(...args);
  }

  deleteUserGroup(...args: Parameters<IDeleteUserGroupUseCase['deleteUserGroup']>) {
    return this.#deleteUserGroupUseCase.deleteUserGroup(...args);
  }
}
