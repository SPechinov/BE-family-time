import {
  UserId,
  UserLanguage,
  UserLanguageUnion,
  UserName,
  UserPatchOnePlainEntity,
  UserPersonalInfoPlainEntity,
  UserPlainEntity,
  UserTimeZone,
} from '@/entities';
import { ErrorInvalidUserPatchParams } from '@/pkg';

const normalizeRequiredProfileTextField = (value?: string | null): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === '') throw new ErrorInvalidUserPatchParams();

  return UserName.create(value).value;
};

const normalizeOptionalProfileTextField = (value?: string | null): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === '') return null;

  return UserName.create(value).value;
};

export const toGetMeCommand = (props: { userId: UserId }) => {
  return {
    userId: props.userId,
  };
};

export const toMeResponse = (user: UserPlainEntity) => {
  return {
    id: user.id,
    timeZone: user.timeZone,
    language: user.language,
    email: user.contacts?.email ?? '',
    phone: user.contacts?.phone ?? '',
    firstName: user.personalInfo?.firstName ?? '',
    lastName: user.personalInfo?.lastName ?? '',
    dateOfBirth: user.personalInfo?.dateOfBirth?.toISOString() ?? '',
  };
};

export const toPatchMeProfileCommand = (props: {
  userId: UserId;
  body: {
    firstName?: string;
    lastName?: string | null;
    dateOfBirth?: Date | null;
    timeZone?: string;
    language?: UserLanguageUnion;
  };
}) => {
  const userPatchOnePlainEntity = toPatchMeEntityCommand(props.body);

  return {
    userId: props.userId,
    userPatchOnePlainEntity,
  };
};

const toPatchMeEntityCommand = (body: {
  firstName?: string;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  timeZone?: string;
  language?: UserLanguageUnion;
}) => {
  const firstName = normalizeRequiredProfileTextField(body.firstName);
  const lastName = normalizeOptionalProfileTextField(body.lastName);

  let personalInfoPlain: UserPersonalInfoPlainEntity | undefined;
  if (firstName !== undefined || lastName !== undefined || body.dateOfBirth !== undefined) {
    personalInfoPlain = new UserPersonalInfoPlainEntity({
      firstName,
      lastName,
      dateOfBirth: body.dateOfBirth,
    });
  }

  return new UserPatchOnePlainEntity({
    personalInfoPlain,
    timeZone: UserTimeZone.fromOptional(body.timeZone),
    language: UserLanguage.fromOptional(body.language),
  });
};
