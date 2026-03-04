import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '@/config';
import { HEADER_NAME, REFRESH_TOKEN_COOKIE_CONFIG } from '../../constants';
import { ErrorInvalidUserAgent, ErrorUnauthorized, RedisClient } from '@/pkg';
import { UserId } from '@/entities';
import { ITokensService } from '../../domains';
import { RefreshTokensStore, SessionData, SessionWithToken } from './refreshTokensStore';
import { AccessTokensBlackList } from './accessTokensBlackList';
import { extractAuthToken } from '../../utils';

export class TokensService implements ITokensService {
  #fastify: FastifyInstance;
  #refreshTokensStore: RefreshTokensStore;
  #accessTokensBlackList: AccessTokensBlackList;

  constructor(props: { fastify: FastifyInstance; redis: RedisClient }) {
    this.#fastify = props.fastify;
    this.#refreshTokensStore = new RefreshTokensStore({ redis: props.redis });
    this.#accessTokensBlackList = new AccessTokensBlackList();
  }

  generateTokens(options: { userId: UserId; request: FastifyRequest }) {
    const userAgent = this.#getUserAgentOrThrow(options.request);
    return {
      access: this.#generateAccessToken({ userId: options.userId, userAgent, request: options.request }),
      refresh: this.#generateRefreshToken({ userId: options.userId, userAgent, request: options.request }),
    };
  }

  #generateAccessToken(options: { userId: UserId; userAgent: string; request: FastifyRequest }): string {
    return this.#fastify.jwt.sign(
      { id: options.userId, userAgent: options.userAgent, createdAt: Date.now() },
      { expiresIn: CONFIG.jwt.access.expiry / 1000 },
    );
  }

  #generateRefreshToken(options: { userId: UserId; userAgent: string; request: FastifyRequest }): string {
    return this.#fastify.jwt.sign(
      { id: options.userId, userAgent: options.userAgent, createdAt: Date.now() },
      { expiresIn: CONFIG.jwt.refresh.expiry / 1000 },
    );
  }

  setTokens(reply: FastifyReply, tokens: { access: string; refresh: string }) {
    this.#setAccessTokenToHeaders(reply, tokens.access);
    this.#setRefreshTokenToCookie(reply, tokens.refresh);
  }

  #setAccessTokenToHeaders(reply: FastifyReply, accessToken: string) {
    return reply.header(HEADER_NAME.authorization, accessToken);
  }

  #setRefreshTokenToCookie(reply: FastifyReply, refreshToken: string) {
    return reply.setCookie(CONFIG.jwt.refresh.cookieName, refreshToken, REFRESH_TOKEN_COOKIE_CONFIG);
  }

  removeRefreshTokenFromCookie(reply: FastifyReply) {
    return reply.setCookie(CONFIG.jwt.refresh.cookieName, '', { ...REFRESH_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }

  getAccessToken = extractAuthToken;

  getRefreshToken(request: FastifyRequest): string | null {
    return request.cookies?.[CONFIG.jwt.refresh.cookieName] || null;
  }

  #getUserAgentOrThrow(request: FastifyRequest) {
    const userAgent = request.headers['user-agent'];
    if (typeof userAgent !== 'string') {
      request.log.warn('User agent not found');
      throw new ErrorInvalidUserAgent();
    }

    return userAgent;
  }

  verifyRefreshToken(refreshToken: string) {
    const payload = this.#fastify.jwt.verify<{ id: UserId }>(refreshToken);
    if (!payload?.id) {
      throw new ErrorUnauthorized();
    }
    return payload;
  }

  async storeSession(options: { userId: UserId; refreshToken: string; userAgent: string }): Promise<void> {
    await this.#refreshTokensStore.setSession(options);
  }

  async getSession(options: { userId: UserId; refreshToken: string }): Promise<SessionData | null> {
    return this.#refreshTokensStore.getSession(options);
  }

  async deleteSession(options: { userId: UserId; refreshToken: string }): Promise<void> {
    await this.#refreshTokensStore.deleteSession(options);
  }

  async deleteAllSessions(options: { userId: UserId }): Promise<void> {
    await this.#refreshTokensStore.deleteAllSessions(options);
  }

  async getAllSessions(options: { userId: UserId; currentRefreshToken?: string }): Promise<SessionWithToken[]> {
    return this.#refreshTokensStore.getAllSessions(options);
  }

  setAccessTokenInBlackList(accessToken: string) {
    this.#accessTokensBlackList.add(accessToken);
  }

  hasAccessTokenInBlackList(accessToken: string) {
    return this.#accessTokensBlackList.has(accessToken);
  }

  async isTokenRecentlyDeleted(options: { userId: UserId; refreshToken: string }): Promise<boolean> {
    return this.#refreshTokensStore.isTokenRecentlyDeleted(options);
  }

  async invalidateAllSessionsAndBlacklist(options: { userId: UserId; accessToken?: string }): Promise<void> {
    const { userId, accessToken } = options;

    // Delete all user sessions
    await this.#refreshTokensStore.deleteAllSessions({ userId });

    // Blacklist the provided access token if present
    if (accessToken) {
      this.#accessTokensBlackList.add(accessToken);
    }
  }
}
