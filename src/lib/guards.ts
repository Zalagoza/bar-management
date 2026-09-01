import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

// Both roles may create records (sales, stock). Only this helper name differs
// so call sites read clearly; it's the same check as requireUser().
export async function requireStaff() {
  return requireUser();
}
