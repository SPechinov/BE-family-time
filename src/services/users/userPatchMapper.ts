import {
  UserPatchOneEntity,
  UserPatchOnePlainEntity,
} from '@/entities';
import { ErrorInvalidUserPatchParams } from '@/pkg/errors';
import { UserContactsHasher } from './userContactsHasher';
import { UserCryptoMapper } from './userCryptoMapper';
import { UserPasswordHasher } from './userPasswordHasher';

export class UserPatchMapper {
  readonly #userContactsHasher: UserContactsHasher;
  readonly #userCryptoMapper: UserCryptoMapper;
  readonly #userPasswordHasher: UserPasswordHasher;

  constructor(props: {
    userContactsHasher: UserContactsHasher;
    userCryptoMapper: UserCryptoMapper;
    userPasswordHasher: UserPasswordHasher;
  }) {
    this.#userContactsHasher = props.userContactsHasher;
    this.#userCryptoMapper = props.userCryptoMapper;
    this.#userPasswordHasher = props.userPasswordHasher;
  }

  async mapPlainToEncrypted(props: {
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
    encryptionSalt: string;
  }): Promise<UserPatchOneEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain, timeZone, language } = props.userPatchOnePlainEntity;

    const [personalInfoEncrypted, contactsEncrypted, passwordHashed] = await Promise.all([
      this.#userCryptoMapper.encryptPersonalInfo(personalInfoPlain, props.encryptionSalt),
      this.#userCryptoMapper.encryptContacts(contactsPlain, props.encryptionSalt),
      this.#userPasswordHasher.hash(passwordPlain),
    ]);
    const contactsHashed = this.#userContactsHasher.hash(contactsPlain);
    const dateOfBirth = personalInfoPlain?.dateOfBirth;

    if (
      personalInfoEncrypted === undefined &&
      contactsEncrypted === undefined &&
      contactsHashed === undefined &&
      passwordHashed === undefined &&
      timeZone === undefined &&
      language === undefined &&
      dateOfBirth === undefined
    ) {
      throw new ErrorInvalidUserPatchParams();
    }

    return new UserPatchOneEntity({
      personalInfoEncrypted,
      contactsEncrypted,
      contactsHashed,
      passwordHashed,
      timeZone,
      language,
      dateOfBirth,
    });
  }
}
