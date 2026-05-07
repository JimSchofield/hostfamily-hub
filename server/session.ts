import { randomBytes } from "crypto";
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { eq, and, gt } from "drizzle-orm";
import { db } from "./db";
import { sessions, users } from "@shared/schema";
import type { User } from "@shared/schema";

const COOKIE_NAME = "session";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = User;

export async function createSession(c: Context, userId: number): Promise<string> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  setCookie(c, COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  return id;
}

export async function destroySession(c: Context): Promise<void> {
  const id = getCookie(c, COOKIE_NAME);
  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id));
  }
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export async function destroyAllUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function getSessionUser(c: Context): Promise<SessionUser | null> {
  const id = getCookie(c, COOKIE_NAME);
  if (!id) return null;
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
}

export async function requireUser(c: Context): Promise<SessionUser> {
  const user = await getSessionUser(c);
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}

export async function requireApproved(c: Context): Promise<SessionUser> {
  const user = await requireUser(c);
  if (user.status !== "approved") {
    throw new HttpError(403, "Your account is pending approval by the coordinator.");
  }
  return user;
}

export async function requireCoordinator(c: Context): Promise<SessionUser> {
  const user = await requireUser(c);
  if (user.role !== "coordinator") {
    throw new HttpError(403, "Access restricted to coordinators only.");
  }
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public field?: string) {
    super(message);
  }
}
