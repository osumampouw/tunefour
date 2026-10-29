import { createHash, randomBytes } from 'node:crypto';

/**
 * Encode bytes as base64url (RFC 4648 §5): standard base64 with '+'→'-',
 * '/'→'_', and no '=' padding. This is the encoding OAuth/OIDC use for the
 * `state`, `nonce`, PKCE verifier, and PKCE challenge.
 */
function base64Url(bytes: Buffer): string {
  return bytes.toString('base64url');
}

/**
 * Generate a high-entropy, URL-safe random token. Used for the one-time `state`
 * (CSRF) and `nonce` (replay) values. 32 random bytes → 43 base64url chars.
 */
export function randomToken(): string {
  return base64Url(randomBytes(32));
}

/**
 * Generate a PKCE `code_verifier`: a high-entropy random secret kept on the
 * server and revealed only at the back-channel token exchange. 32 bytes
 * produces a 43-character verifier, within the RFC 7636 length bounds (43–128).
 */
export function generateCodeVerifier(): string {
  return base64Url(randomBytes(32));
}

/**
 * Compute the PKCE `code_challenge` for the "S256" method:
 * base64url(SHA-256(code_verifier)). Only the challenge travels the untrusted
 * front channel; the verifier that produced it stays on the server, so a stolen
 * authorization code is useless without it.
 */
export function computeCodeChallenge(codeVerifier: string): string {
  return base64Url(createHash('sha256').update(codeVerifier).digest());
}
