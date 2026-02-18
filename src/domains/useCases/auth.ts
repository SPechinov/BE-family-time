import { UserContactsPlainEntity, UserCreatePlainEntity, UserHashedEntity, UserPasswordPlainEntity } from '@/entities';
import { ILogger } from '@/pkg';
import { JwtPayload } from 'jsonwebtoken';

export interface IAuthUseCases {
  login(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    userPasswordPlainEntity: UserPasswordPlainEntity;
    jwtPayload?: Record<string, string>;
    logger: ILogger;
  }): Promise<{ accessToken: string; refreshToken: string }>;

  registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: ILogger;
  }): Promise<{ otpCode: string }>;

  registrationEnd(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    otpCode: string;
    logger: ILogger;
  }): Promise<UserHashedEntity>;

  forgotPasswordStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: ILogger;
  }): Promise<{ otpCode: string }>;

  forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    password: UserPasswordPlainEntity;
    otpCode: string;
    logger: ILogger;
  }): Promise<UserHashedEntity>;

  getAllSessionsPayloads(props: { userId: string }): Promise<{ payload: JwtPayload | string | null; jwt: string }[]>;

  logoutAllSessions(props: { userId: string }): Promise<void>;

  logoutSession(props: { userId: string; refreshToken: string }): Promise<void>;

  refreshTokens(props: {
    refreshToken: string;
    jwtPayload?: Record<string, string>;
    logger: ILogger;
  }): Promise<{ accessToken: string; refreshToken: string }>;
}
