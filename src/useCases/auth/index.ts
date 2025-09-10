import { IAuthUseCases } from '../../domain/useCases';
import { IUserRepository } from '../../domain/repositories/db';
import { IAuthRegistrationStore } from '../../domain/repositories/stores';

export class AuthUseCases implements IAuthUseCases {
  #userRepository: IUserRepository;
  #authRegistrationStore: IAuthRegistrationStore;

  constructor(props: { userRepository: IUserRepository; authRegistrationStore: IAuthRegistrationStore }) {
    this.#userRepository = props.userRepository;
    this.#authRegistrationStore = props.authRegistrationStore;
  }
}
