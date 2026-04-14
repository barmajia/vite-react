export type AuthHashParams = {
  accessToken?: string;
  refreshToken?: string;
  errorCode?: string;
  errorDescription?: string;
  type?: string;
};

export function parseAuthHash(hash: string): AuthHashParams {
  try {
    const hashStr = hash.startsWith("#") ? hash.substring(1) : hash;
    const params = new URLSearchParams(hashStr);
    return {
      accessToken: params.get("access_token") ?? undefined,
      refreshToken: params.get("refresh_token") ?? undefined,
      errorCode: params.get("error") ?? undefined,
      errorDescription: params.get("error_description") ?? undefined,
      type: params.get("type") ?? undefined,
    };
  } catch {
    return {} as AuthHashParams;
  }
}
