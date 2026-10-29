/**
 * Names of the cookies the auth flow sets. All are HttpOnly so browser
 * JavaScript can't read them.
 */
export const ACCESS_COOKIE = 'tf_access';
export const REFRESH_COOKIE = 'tf_refresh';

/**
 * Short-lived cookie holding the signed OAuth "transaction" (state, nonce, PKCE
 * verifier) between the redirect to Google and the callback.
 */
export const OAUTH_TX_COOKIE = 'tf_oauth_tx';

/**
 * Dependency-injection token for the active {@link AuthProvider}. Lets the rest
 * of the module depend on the interface while the module decides which concrete
 * provider (Google OIDC now, Keycloak later) is wired in.
 */
export const AUTH_PROVIDER = 'AUTH_PROVIDER';
