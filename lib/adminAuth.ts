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

export async function requireAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE_NAME + '='));
  if (!match) return false;
  const token = match.slice((COOKIE_NAME + '=').length);
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
