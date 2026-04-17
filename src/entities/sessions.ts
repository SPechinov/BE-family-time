import { UUID } from 'node:crypto';
import { UserId } from './user';

export type SessionId = UUID & { readonly __brand: 'SessionId' };
export type SessionTokenUnion = 'access' | 'refresh';
export const toSessionId = (value: string): SessionId => value as SessionId;

export interface SessionTokenMeta {
  jti: string;
  expiresAt: number;
}

export interface SessionTokenPayload {
  userId: UserId;
  sid: SessionId;
  jti: string;
  exp: number;
  typ: SessionTokenUnion;
}

export class SessionEntity {
  readonly #userId: UserId;
  readonly #sessionId: SessionId;
  readonly #userAgent: string;
  readonly #expiresAt: number;
  readonly #refreshJtiHash: string;
  readonly #accessJtiHash: string;
  readonly #accessExpiresAt: number;

  constructor(props: {
    userId: UserId;
    sessionId: SessionId;
    userAgent: string;
    expiresAt: number;
    refreshJtiHash: string;
    accessJtiHash: string;
    accessExpiresAt: number;
  }) {
    this.#userId = props.userId;
    this.#sessionId = props.sessionId;
    this.#userAgent = props.userAgent;
    this.#expiresAt = props.expiresAt;
    this.#refreshJtiHash = props.refreshJtiHash;
    this.#accessJtiHash = props.accessJtiHash;
    this.#accessExpiresAt = props.accessExpiresAt;
  }

  get userId() {
    return this.#userId;
  }

  get sessionId() {
    return this.#sessionId;
  }

  get userAgent() {
    return this.#userAgent;
  }

  get expiresAt() {
    return this.#expiresAt;
  }

  get refreshJtiHash() {
    return this.#refreshJtiHash;
  }

  get accessJtiHash() {
    return this.#accessJtiHash;
  }

  get accessExpiresAt() {
    return this.#accessExpiresAt;
  }
}

export class UserSessionEntity {
  readonly #userId: UserId;
  readonly #sessionId: SessionId;
  readonly #userAgent: string;
  readonly #expiresAt: number;
  readonly #isCurrent: boolean;

  constructor(props: {
    userId: UserId;
    sessionId: SessionId;
    userAgent: string;
    expiresAt: number;
    isCurrent: boolean;
  }) {
    this.#userId = props.userId;
    this.#sessionId = props.sessionId;
    this.#userAgent = props.userAgent;
    this.#expiresAt = props.expiresAt;
    this.#isCurrent = props.isCurrent;
  }

  get userId() {
    return this.#userId;
  }

  get sessionId() {
    return this.#sessionId;
  }

  get userAgent() {
    return this.#userAgent;
  }

  get expiresAt() {
    return this.#expiresAt;
  }

  get isCurrent() {
    return this.#isCurrent;
  }
}
