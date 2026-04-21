import {
  SessionTokenMeta,
  SessionTokenPayload,
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserLanguage,
  UserLanguageUnion,
  UserName,
  UserPasswordPlainEntity,
  UserPersonalInfoPlainEntity,
  UserSessionEntity,
  UserTimeZone,
  toSessionId,
} from '@/entities';

export const toLoginCommand = (props: { email: string; password: string; userAgent: string }) => {
  return {
    userContactsPlainEntity: new UserContactsPlainEntity({
      email: props.email,
    }),
    userPasswordPlainEntity: new UserPasswordPlainEntity(props.password),
    userAgent: props.userAgent,
  };
};

export const toRegistrationStartCommand = (props: { email: string }) => {
  return {
    userContactsPlainEntity: new UserContactsPlainEntity({ email: props.email }),
  };
};

export const toRegistrationEndCommand = (props: {
  email: string;
  otpCode: string;
  firstName: string;
  password: string;
  timeZone: string;
  language: UserLanguageUnion;
}) => {
  return {
    otpCode: props.otpCode,
    userCreatePlainEntity: new UserCreatePlainEntity({
      timeZone: UserTimeZone.create(props.timeZone).value,
      language: UserLanguage.create(props.language).value,
      contactsPlain: new UserContactsPlainEntity({ email: props.email }),
      personalInfoPlain: new UserPersonalInfoPlainEntity({
        firstName: UserName.create(props.firstName).value,
      }),
      passwordPlain: new UserPasswordPlainEntity(props.password),
    }),
  };
};

export const toForgotPasswordStartCommand = (props: { email: string }) => {
  return {
    userContactsPlainEntity: new UserContactsPlainEntity({ email: props.email }),
  };
};

export const toForgotPasswordEndCommand = (props: { email: string; otpCode: string; password: string }) => {
  return {
    userContactsPlainEntity: new UserContactsPlainEntity({ email: props.email }),
    otpCode: props.otpCode,
    password: new UserPasswordPlainEntity(props.password),
  };
};

export const toGetAllSessionsCommand = (payload: SessionTokenPayload) => {
  return {
    userId: payload.userId,
    refreshJti: payload.jti,
    currentSessionId: payload.sid,
  };
};

export const toLogoutAllSessionsCommand = (props: {
  payload: SessionTokenPayload;
  currentAccessToken?: SessionTokenMeta;
}) => {
  return {
    userId: props.payload.userId,
    refreshJti: props.payload.jti,
    currentAccessToken: props.currentAccessToken,
  };
};

export const toLogoutSessionCommand = (props: {
  payload: SessionTokenPayload;
  currentAccessToken?: SessionTokenMeta;
}) => {
  return {
    userId: props.payload.userId,
    refreshJti: props.payload.jti,
    currentAccessToken: props.currentAccessToken,
  };
};

export const toLogoutSessionByIdCommand = (props: {
  payload: SessionTokenPayload;
  sessionId: string;
  currentAccessToken?: SessionTokenMeta;
}) => {
  return {
    userId: props.payload.userId,
    refreshJti: props.payload.jti,
    sessionId: toSessionId(props.sessionId),
    currentSessionId: props.payload.sid,
    currentAccessToken: props.currentAccessToken,
  };
};

export const toRefreshTokensCommand = (props: {
  refreshToken: string;
  userAgent: string;
  currentAccessToken?: string;
}) => {
  return {
    refreshToken: props.refreshToken,
    userAgent: props.userAgent,
    currentAccessToken: props.currentAccessToken,
  };
};

export const toGetAllSessionsResponse = (sessions: UserSessionEntity[]) => {
  return {
    sessions: sessions.map((session) => ({
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      isCurrent: session.isCurrent,
    })),
  };
};
