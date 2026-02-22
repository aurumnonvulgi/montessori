export const AUTH_COOKIE_NAME = "mds_app_auth";
export const AUTH_COOKIE_VALUE = "verified";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const FALLBACK_APP_PASSWORD = "W2026";
const FALLBACK_APP_PASSWORDS = [FALLBACK_APP_PASSWORD, "E2026"];

export const getAppPassword = () => (process.env.MDS_APP_PASSWORD ?? FALLBACK_APP_PASSWORD).trim();

export const isPasswordValid = (candidate: unknown) => {
  if (typeof candidate !== "string") return false;
  const envPassword = getAppPassword();
  const allowedPasswords = new Set([...FALLBACK_APP_PASSWORDS, envPassword]);
  return allowedPasswords.has(candidate.trim());
};

export const isAuthenticatedCookie = (value?: string) => value === AUTH_COOKIE_VALUE;
