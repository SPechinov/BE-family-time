export interface ITokensSessionsBlacklistStore {
  addAccessJtiToBlacklist(props: { accessJti: string; expiresAt: number }): Promise<void>;
  hasAccessJtiInBlacklist(props: { accessJti: string }): Promise<boolean>;
  addHashedAccessJtiToBlacklist(props: { accessJtiHash: string; expiresAt: number }): Promise<void>;
}
