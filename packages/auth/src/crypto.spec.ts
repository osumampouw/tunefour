import {
  computeCodeChallenge,
  generateCodeVerifier,
  randomToken,
} from './crypto';

describe('computeCodeChallenge', () => {
  it('matches the RFC 7636 S256 test vector', () => {
    // Appendix B of RFC 7636: this verifier must hash to this challenge.
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expected = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    expect(computeCodeChallenge(verifier)).toBe(expected);
  });

  it('is deterministic for a given verifier', () => {
    const verifier = generateCodeVerifier();
    expect(computeCodeChallenge(verifier)).toBe(computeCodeChallenge(verifier));
  });

  it('produces URL-safe output (no +, /, or = padding)', () => {
    const challenge = computeCodeChallenge('any-verifier-value');
    expect(challenge).not.toMatch(/[+/=]/);
  });
});

describe('randomToken / generateCodeVerifier', () => {
  it('generates distinct, non-empty, URL-safe tokens each call', () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toMatch(/[+/=]/);
  });

  it('generates a PKCE verifier within the RFC 7636 length bounds (43–128)', () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });
});
