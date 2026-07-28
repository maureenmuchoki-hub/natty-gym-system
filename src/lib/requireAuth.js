import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

/**
 * Reads the token cookie, verifies it, and returns the logged-in user
 * (or null if not authenticated). Call this at the top of any API route
 * you want to protect.
 */
export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  await dbConnect();
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

/**
 * Checks whether a given user's role is in the allowed list.
 * Usage: requireRole(user, ["admin", "staff"])
 */
export function requireRole(user, allowedRoles) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}