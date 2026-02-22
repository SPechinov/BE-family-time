import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity, UserPasswordPlainEntity } from '@/entities';
import { JwtPayload } from 'jsonwebtoken';
import { DefaultProps } from './types';
import { UUID } from 'node:crypto';

export interface IAuthUseCases {
  login(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      userPasswordPlainEntity: UserPasswordPlainEntity;
      jwtPayload?: Record<string, string>;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }>;

  registrationStart(
    props: DefaultProps<{ userContactsPlainEntity: UserContactsPlainEntity }>,
  ): Promise<{ otpCode: string }>;

  registrationEnd(
    props: DefaultProps<{ userCreatePlainEntity: UserCreatePlainEntity; otpCode: string }>,
  ): Promise<UserEntity>;

  forgotPasswordStart(
    props: DefaultProps<{ userContactsPlainEntity: UserContactsPlainEntity }>,
  ): Promise<{ otpCode: string }>;

  forgotPasswordEnd(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      password: UserPasswordPlainEntity;
      otpCode: string;
    }>,
  ): Promise<UserEntity>;

  getAllSessionsPayloads(
    props: DefaultProps<{ userId: UUID }>,
  ): Promise<{ payload: JwtPayload | string | null; jwt: string }[]>;

  logoutAllSessions(props: DefaultProps<{ userId: UUID }>): Promise<void>;

  logoutSession(props: DefaultProps<{ userId: UUID; refreshToken: string }>): Promise<void>;

  refreshTokens(
    props: DefaultProps<{
      refreshToken: string;
      jwtPayload?: Record<string, string>;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }>;
}
