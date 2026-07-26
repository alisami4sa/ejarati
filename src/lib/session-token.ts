import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ejarati_session";

type SessionPayload = {
  sub: string;
  email: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!sub || !email) return null;
    return { id: sub, email };
  } catch {
    return null;
  }
}
