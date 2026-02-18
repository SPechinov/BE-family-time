import { JwtService } from '@/services/jwt';
import { IJwtService } from '@/domains/services';

export const createJwtService = (): IJwtService => {
  return new JwtService();
};
