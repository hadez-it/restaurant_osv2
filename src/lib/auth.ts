import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type Role = "ADMIN" | "WAITER" | "KITCHEN" | "CASHIER";

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, SECRET, { expiresIn: "12h" });
}

export function getSessionUser(): SessionUser | null {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export function requireRole(...roles: Role[]): SessionUser {
  const user = getSessionUser();
  if (!user) throw new AuthError(401, "Not authenticated");
  if (!roles.includes(user.role)) throw new AuthError(403, "Forbidden");
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function homeFor(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "WAITER":
      return "/waiter";
    case "KITCHEN":
      return "/kitchen";
    case "CASHIER":
      return "/cashier";
  }
}
