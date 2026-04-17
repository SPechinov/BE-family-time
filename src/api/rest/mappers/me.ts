import { UserLanguage, UserPatchOnePlainEntity, UserPersonalInfoPlainEntity, UserPlainEntity } from '@/entities';

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

export const toPatchMeCommand = (body: {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  timeZone?: string;
  language?: UserLanguage;
}) => {
  let personalInfoPlain: UserPersonalInfoPlainEntity | undefined;
  if (body.firstName !== undefined || body.lastName !== undefined || body.dateOfBirth !== undefined) {
    personalInfoPlain = new UserPersonalInfoPlainEntity({
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
    });
  }

  return new UserPatchOnePlainEntity({
    personalInfoPlain,
    timeZone: body.timeZone,
    language: body.language,
  });
};
