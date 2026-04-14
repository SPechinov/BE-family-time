import { UserId } from '@/entities';

export interface SessionData {
  userId: UserId;
  sessionId: string;
  userAgent: string;
  expiresAt: number;
  refreshJtiHash: string;
  accessJtiHash: string;
  accessExpiresAt: number;
}

export interface CreateSessionParams {
  userId: UserId;
  sessionId: string;
  userAgent: string;
  expiresAt: number;
  refreshJti: string;
  accessJti: string;
  accessExpiresAt: number;
}

export interface UserSession {
  userId: UserId;
  sessionId: string;
  userAgent: string;
  expiresAt: number;
  isCurrent: boolean;
}

export interface ITokensSessionsStore {
  createSession(params: CreateSessionParams): Promise<void>;
  getSessionByRefreshJti(props: { userId: UserId; refreshJti: string }): Promise<SessionData | null>;
  getSessionById(props: { sessionId: string }): Promise<SessionData | null>;
  getUserSessions(props: { userId: UserId; currentSessionId?: string }): Promise<UserSession[]>;
  deleteSessionById(props: { userId: UserId; sessionId: string }): Promise<void>;
  deleteSessionByRefreshJti(props: { userId: UserId; refreshJti: string }): Promise<void>;
  deleteAllSessions(props: { userId: UserId }): Promise<void>;
}
