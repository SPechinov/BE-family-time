import { DefaultProps } from '../types';

export interface IRefreshTokensUseCase {
  execute(
    props: DefaultProps<{
      refreshToken: string;
      userAgent: string;
      currentAccessToken?: string;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }>;
}
