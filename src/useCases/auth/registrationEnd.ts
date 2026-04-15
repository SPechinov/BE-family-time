import { IAuthUseCases, IRegistrationEndUseCase } from '@/domains/useCases';

export class RegistrationEndUseCase implements IRegistrationEndUseCase {
  readonly #authUseCases: IAuthUseCases;

  constructor(props: { authUseCases: IAuthUseCases }) {
    this.#authUseCases = props.authUseCases;
  }

  async execute(props: Parameters<IRegistrationEndUseCase['execute']>[0]): Promise<void> {
    await this.#authUseCases.registrationEnd({
      logger: props.logger,
      otpCode: props.otpCode,
      userCreatePlainEntity: props.userCreatePlainEntity,
    });
  }
}
