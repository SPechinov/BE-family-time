import { UserId } from '@/entities';

interface SessionData {
  id: UserId;
  userAgent: string;
  expiresAt: number;
}

export class TokenStore {

}