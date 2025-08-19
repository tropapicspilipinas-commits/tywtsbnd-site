import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_token';
const alg = 'HS256';

function getSecret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET missing');
  return new TextEncoder().encode(s);
}

export async function setAdminSession() {
  const ttlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || '12');
  const exp = Math.floor(Date.now() / 1000) + ttlHours * 60 * 60;
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg })
    .setExpirationTime(exp)
    .sign(getSecret());

  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ttlHours * 60 * 60,
  });
}

export function clearAdminSession() {
  cookies().set({ name: COOKIE_NAME, value: '', maxAge: 0, path: '/' });
}

export async function requireAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookie = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE_NAME + '='));
  if (!cookie) return false;
  const token = cookie.split('=')[1];
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
