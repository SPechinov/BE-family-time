import {
  UserId,
  UserLanguageUnion,
  UserLanguage,
  UserName,
  UserPatchOnePlainEntity,
  UserPersonalInfoPlainEntity,
  UserPlainEntity,
  UserTimeZone,
} from '@/entities';

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
    firstName?: string | null;
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

export const toPatchMeEntityCommand = (body: {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  timeZone?: string;
  language?: UserLanguageUnion;
}) => {
  const firstName = UserName.fromPatchInput(body.firstName);
  const lastName = UserName.fromPatchInput(body.lastName);

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
