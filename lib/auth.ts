import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "rag-admin-session";
const SESSION_SECONDS = 60 * 60 * 8;

function credentials() {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!login || !password || !secret || secret.length < 32) {
    throw new Error(
      "Заполните ADMIN_LOGIN, ADMIN_PASSWORD и SESSION_SECRET (минимум 32 символа) в .env.local",
    );
  }
  return { login, password, key: new TextEncoder().encode(secret) };
}
function digest(value: string) {
  return createHash("sha256").update(value).digest();
}
function version() {
  const { login, password } = credentials();
  return createHmac("sha256", credentials().key)
    .update(JSON.stringify([login, password]))
    .digest("hex");
}
export function verifyCredentials(login: string, password: string) {
  const expected = credentials();
  const loginMatches = timingSafeEqual(digest(login), digest(expected.login));
  const passwordMatches = timingSafeEqual(
    digest(password),
    digest(expected.password),
  );
  return loginMatches && passwordMatches;
}
export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, credentials().key, {
      algorithms: ["HS256"],
      issuer: "rag-admin",
      audience: "rag-admin",
    });
    if (payload.sub !== credentials().login || payload.version !== version())
      return null;
    return { login: payload.sub };
  } catch {
    return null;
  }
}
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
export async function createSession() {
  const { login, key } = credentials();
  const token = await new SignJWT({ version: version() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(login)
    .setIssuer("rag-admin")
    .setAudience("rag-admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(key);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}
export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
