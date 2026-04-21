import { UserContactsHashedEntity, UserContactsPlainEntity } from '@/entities';
import { IHmacService } from '@/domains/services';

export class UserContactsHasher {
  readonly #hmacService: IHmacService;

  constructor(props: { hmacService: IHmacService }) {
    this.#hmacService = props.hmacService;
  }

  hash(contactsPlain?: UserContactsPlainEntity | null): UserContactsHashedEntity | null | undefined {
    if (contactsPlain === undefined) return undefined;
    if (contactsPlain === null) return null;

    return new UserContactsHashedEntity({
      email: contactsPlain.email ? this.#hmacService.hash(contactsPlain.email) : contactsPlain.email,
      phone: contactsPlain.phone ? this.#hmacService.hash(contactsPlain.phone) : contactsPlain.phone,
    });
  }
}
