import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

export type AdminSession = {
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
};

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    process.env.NODE_ENV !== "production" &&
    (!supabaseUrl || !supabaseAnonKey)
  ) {
    const email =
      process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "admin@example.com";
    return { email, role: "owner" };
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

  return { email, role: admin.role };
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  return admin;
}
