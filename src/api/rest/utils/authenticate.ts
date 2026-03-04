import { FastifyRequest } from 'fastify';
import { ErrorTokenExpired, ErrorUnauthorized } from '@/pkg';
import { UserId } from '@/entities';
import { ITokensService } from '../domains';

export const authenticate = async (request: FastifyRequest, props: { tokensService: ITokensService }) => {
  try {
    const payload = await request.jwtVerify<{ id: UserId }>();
    request.userId = payload.id;
  } catch (error: unknown) {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      throw error;
    }

    switch (error.code) {
      case 'FST_JWT_AUTHORIZATION_TOKEN_INVALID': {
        throw new ErrorUnauthorized();
      }
      case 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED': {
        throw new ErrorTokenExpired();
      }
    }

    throw error;
  }

  const accessToken = props.tokensService.getAccessToken(request);
  if (!accessToken || props.tokensService.hasAccessTokenInBlackList(accessToken)) {
    throw new ErrorUnauthorized();
  }
};
