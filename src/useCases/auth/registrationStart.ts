import { IAuthUseCases, IRegistrationStartUseCase } from '@/domains/useCases';

export class RegistrationStartUseCase implements IRegistrationStartUseCase {
  readonly #authUseCases: IAuthUseCases;

  constructor(props: { authUseCases: IAuthUseCases }) {
    this.#authUseCases = props.authUseCases;
  }

  execute(props: Parameters<IRegistrationStartUseCase['execute']>[0]): Promise<{ otpCode: string }> {
    return this.#authUseCases.registrationStart({
      logger: props.logger,
      userContactsPlainEntity: props.userContactsPlainEntity,
    });
  }
}
