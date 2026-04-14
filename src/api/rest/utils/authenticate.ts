import { FastifyRequest } from 'fastify';
import { ErrorTokenExpired, ErrorUnauthorized } from '@/pkg';
import { UserId } from '@/entities';
import { ITokensSessionsBlacklistStore } from '@/domains/repositories/stores';

export const authenticate = async (
  request: FastifyRequest,
  props: { tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore },
) => {
  let payload: { userId?: UserId; id?: UserId; typ?: 'access' | 'refresh'; jti?: string };
  try {
    payload = await request.jwtVerify<{ userId?: UserId; id?: UserId; typ?: 'access' | 'refresh'; jti?: string }>();
  } catch (error: unknown) {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      throw error;
    }

    switch (error.code) {
      case 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED':
        throw new ErrorTokenExpired();
      case 'FST_JWT_AUTHORIZATION_TOKEN_INVALID':
      case 'FST_JWT_NO_AUTHORIZATION_HEADER':
      case 'FST_JWT_INVALID_AUTHORIZATION_HEADER':
        throw new ErrorUnauthorized();
    }

    throw new ErrorUnauthorized();
  }

  const userId = payload.userId ?? payload.id;
  if (!userId || payload.typ !== 'access' || !payload.jti) {
    throw new ErrorUnauthorized();
  }

  if (await props.tokensSessionsBlacklistStore.hasAccessJtiInBlacklist({ accessJti: payload.jti })) {
    throw new ErrorUnauthorized();
  }

  request.userId = userId;
};
