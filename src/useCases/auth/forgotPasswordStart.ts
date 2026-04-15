import { IAuthUseCases, IForgotPasswordStartUseCase } from '@/domains/useCases';

export class ForgotPasswordStartUseCase implements IForgotPasswordStartUseCase {
  readonly #authUseCases: IAuthUseCases;

  constructor(props: { authUseCases: IAuthUseCases }) {
    this.#authUseCases = props.authUseCases;
  }

  execute(props: Parameters<IForgotPasswordStartUseCase['execute']>[0]): Promise<{ otpCode: string }> {
    return this.#authUseCases.forgotPasswordStart({
      logger: props.logger,
      userContactsPlainEntity: props.userContactsPlainEntity,
    });
  }
}
