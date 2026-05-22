import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

export type AdminRole = "owner" | "admin" | "editor" | "viewer";
export type AdminStatus = "active" | "inactive" | "disabled" | string;

export type AdminSession = {
  id: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
};

export class AdminAuthError extends Error {
  constructor(
    message: "Unauthorized" | "Forbidden",
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function getAdminAuthErrorStatus(error: unknown): 401 | 403 | 500 {
  return error instanceof AdminAuthError ? error.status : 500;
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    process.env.NODE_ENV !== "production" &&
    (!supabaseUrl || !supabaseAnonKey || !hasDatabaseUrl)
  ) {
    const email =
      process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "admin@example.com";
    return {
      id: "development-admin",
      email,
      role: "owner",
      status: "active",
    };
  }

  if (!supabaseUrl || !supabaseAnonKey || !hasDatabaseUrl) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components cannot always set cookies; middleware can handle refresh.
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;

  if (!email) {
    return null;
  }

  const admin = await getPrisma().adminUser.findUnique({ where: { email } });

  if (!admin || admin.status !== "active") {
    return null;
  }

  return {
    id: admin.id,
    email,
    role: admin.role,
    status: admin.status,
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new AdminAuthError("Unauthorized", 401);
  }

  return admin;
}

export async function requireAdminRole(
  allowedRoles: readonly AdminRole[],
): Promise<AdminSession> {
  const admin = await requireAdmin();

  if (!allowedRoles.includes(admin.role)) {
    throw new AdminAuthError("Forbidden", 403);
  }

  return admin;
}

export function canManageAdminUsers(admin: AdminSession): boolean {
  return admin.role === "owner";
}
