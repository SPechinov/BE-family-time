import { UserPasswordHashedEntity, UserPasswordPlainEntity } from '@/entities';
import { IHashPasswordService } from '@/domains/services';

export class UserPasswordHasher {
  readonly #hashPasswordService: IHashPasswordService;

  constructor(props: { hashPasswordService: IHashPasswordService }) {
    this.#hashPasswordService = props.hashPasswordService;
  }

  async hash(passwordPlain?: UserPasswordPlainEntity | null): Promise<UserPasswordHashedEntity | null | undefined> {
    if (passwordPlain === undefined) return undefined;
    if (passwordPlain === null) return null;

    const hashedPassword = await this.#hashPasswordService.hash(passwordPlain.password);
    return new UserPasswordHashedEntity(hashedPassword);
  }
}
