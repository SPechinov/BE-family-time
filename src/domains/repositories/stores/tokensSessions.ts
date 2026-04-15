import { SessionEntity, SessionId, UserId, UserSessionEntity } from '@/entities';

export interface AddSessionParams {
  userId: UserId;
  sessionId: SessionId;
  userAgent: string;
  expiresAt: number;
  refreshJti: string;
  accessJti: string;
  accessExpiresAt: number;
}

export interface ITokensSessionsStore {
  addSession(params: AddSessionParams): Promise<void>;
  getSessionByRefreshJti(props: { userId: UserId; refreshJti: string }): Promise<SessionEntity | null>;
  getSessionById(props: { sessionId: SessionId }): Promise<SessionEntity | null>;
  getUserSessions(props: { userId: UserId; currentSessionId?: SessionId }): Promise<UserSessionEntity[]>;
  deleteSessionById(props: { userId: UserId; sessionId: SessionId }): Promise<void>;
  deleteSessionByRefreshJti(props: { userId: UserId; refreshJti: string }): Promise<void>;
  deleteAllSessions(props: { userId: UserId }): Promise<void>;
}
