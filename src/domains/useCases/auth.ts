import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity, UserPasswordPlainEntity } from '@/entities';
import { ILogger } from '@/pkg';

export interface IAuthUseCases {
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
