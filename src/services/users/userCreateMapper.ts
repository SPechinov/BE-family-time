import { UserCreateEntity, UserCreatePlainEntity } from '@/entities';
import { UserContactsHasher } from './userContactsHasher';
import { UserCryptoMapper } from './userCryptoMapper';
import { UserPasswordHasher } from './userPasswordHasher';

export class UserCreateMapper {
  readonly #userCryptoMapper: UserCryptoMapper;
  readonly #userContactsHasher: UserContactsHasher;
  readonly #userPasswordHasher: UserPasswordHasher;

  constructor(props: {
    userCryptoMapper: UserCryptoMapper;
    userContactsHasher: UserContactsHasher;
    userPasswordHasher: UserPasswordHasher;
  }) {
    this.#userCryptoMapper = props.userCryptoMapper;
    this.#userContactsHasher = props.userContactsHasher;
    this.#userPasswordHasher = props.userPasswordHasher;
  }

  async mapPlainToCreate(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    encryptionSalt: string;
  }): Promise<UserCreateEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain } = props.userCreatePlainEntity;

    const [personalInfoEncrypted, contactsEncrypted, passwordHashed] = await Promise.all([
      this.#userCryptoMapper.encryptPersonalInfo(personalInfoPlain, props.encryptionSalt),
      this.#userCryptoMapper.encryptContacts(contactsPlain, props.encryptionSalt),
      this.#userPasswordHasher.hash(passwordPlain),
    ]);

    const contactsHashed = this.#userContactsHasher.hash(contactsPlain);

    return new UserCreateEntity({
      encryptionSalt: props.encryptionSalt,
      timeZone: props.userCreatePlainEntity.timeZone,
      language: props.userCreatePlainEntity.language,
      personalInfoEncrypted: personalInfoEncrypted ?? undefined,
      contactsHashed: contactsHashed ?? undefined,
      contactsEncrypted: contactsEncrypted ?? undefined,
      passwordHashed: passwordHashed ?? undefined,
    });
  }
}
