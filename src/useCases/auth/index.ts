import { IAuthUseCases } from '../../domain/useCases';
import { IUserRepository } from '../../domain/repositories';

export class AuthUseCases implements IAuthUseCases {
  #userRepository: IUserRepository;

  constructor(props: { userRepository: IUserRepository }) {
    this.#userRepository = props.userRepository;
  }
}
