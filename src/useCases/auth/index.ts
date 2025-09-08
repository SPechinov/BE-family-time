import { IAuthUseCases } from '../../domain/useCases';
import { IUserRepository } from '../../domain/repositories/db';
import { IAuthStore } from '../../domain/repositories/stores';

export class AuthUseCases implements IAuthUseCases {
  #userRepository: IUserRepository;
  #authStore: IAuthStore;

  constructor(props: { userRepository: IUserRepository; authStore: IAuthStore }) {
    this.#userRepository = props.userRepository;
    this.#authStore = props.authStore;
  }
}
