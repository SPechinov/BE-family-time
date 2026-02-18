import { RedisClient } from '@/pkg';
import { OtpCodesService } from '@/services';
import { IOtpCodesService } from '@/domains/services';
import { CONFIG } from '@/config';

interface CreateAuthOtpServicesProps {
  redis: RedisClient;
}

interface AuthOtpServices {
  registrationOtpCodesService: IOtpCodesService;
  forgotPasswordOtpCodesService: IOtpCodesService;
}

export const createAuthOtpServices = (props: CreateAuthOtpServicesProps): AuthOtpServices => {
  const { redis } = props;

  const registrationOtpCodesService = new OtpCodesService({
    redis,
    prefix: 'auth-registration-otp',
    codeLength: CONFIG.codesLength.registration,
    ttlSec: CONFIG.ttls.registrationSec,
  });

  const forgotPasswordOtpCodesService = new OtpCodesService({
    redis,
    prefix: 'auth-forgot-password-otp',
    codeLength: CONFIG.codesLength.forgotPassword,
    ttlSec: CONFIG.ttls.forgotPasswordSec,
  });

  return {
    registrationOtpCodesService,
    forgotPasswordOtpCodesService,
  };
};
