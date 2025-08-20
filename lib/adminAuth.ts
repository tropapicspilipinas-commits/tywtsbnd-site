import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'admin_token';
const alg = 'HS256';

function getSecret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET missing');
  return new TextEncoder().encode(s);
}

export async function buildSessionToken() {
  const ttlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || '12');
  const exp = Math.floor(Date.now() / 1000) + ttlHours * 60 * 60;
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg })
    .setExpirationTime(exp)
    .sign(getSecret());
  return { token, maxAgeSeconds: ttlHours * 60 * 60 };
}

/** Verify a JWT string (from cookie). */
export async function verifyAdminToken(token: string | null | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
