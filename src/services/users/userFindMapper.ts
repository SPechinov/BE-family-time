import { UserFindOneEntity, UserFindOnePlainEntity } from '@/entities';
import { ErrorInvalidUserFindParams } from '@/pkg/errors';
import { UserContactsHasher } from './userContactsHasher';

export class UserFindMapper {
  readonly #userContactsHasher: UserContactsHasher;

  constructor(props: { userContactsHasher: UserContactsHasher }) {
    this.#userContactsHasher = props.userContactsHasher;
  }

  mapPlainToFindOrThrow(userFindOnePlainEntity: UserFindOnePlainEntity): UserFindOneEntity {
    const { id, contactsPlain } = userFindOnePlainEntity;
    if (id) return new UserFindOneEntity({ id });

    if (!contactsPlain?.getContact()) {
      throw new ErrorInvalidUserFindParams();
    }

    return new UserFindOneEntity({
      contactsHashed: this.#userContactsHasher.hash(contactsPlain) ?? undefined,
    });
  }
}
