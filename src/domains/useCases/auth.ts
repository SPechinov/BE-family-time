import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity, UserPasswordPlainEntity } from '@/entities';
import { ILogger } from '@/pkg';

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
  }): Promise<UserEntity>;

  forgotPasswordStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: ILogger;
  }): Promise<{ otpCode: string }>;

  forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    password: UserPasswordPlainEntity;
    otpCode: string;
    logger: ILogger;
  }): Promise<UserEntity>;
}
