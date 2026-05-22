import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "邮箱或密码不正确。",
  unauthorized: "此账号没有后台访问权限。",
  configuration: "后台登录尚未完成配置。",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const admin = await getCurrentAdmin();
  const params = await searchParams;

  if (admin) {
    redirect(getSafeNextPath(params.next));
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div>
          <p className="text-sm font-medium text-blue-300">ModelRate Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">管理员登录</h1>
          <p className="mt-2 text-sm text-slate-400">
            使用 Supabase Auth 账号进入后台。
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <form action={login} className="mt-6 grid gap-4">
          <input
            type="hidden"
            name="next"
            value={getSafeNextPath(params.next)}
          />
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-200">Email</span>
            <input
              autoComplete="email"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-400"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-200">Password</span>
            <input
              autoComplete="current-password"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-400"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
            type="submit"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}

async function login(formData: FormData) {
  "use server";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const nextPath = getSafeNextPath(formData.get("next"));

  if (!supabaseUrl || !supabaseAnonKey || !hasDatabaseUrl) {
    redirect(
      `/admin/login?error=configuration&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user.email) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const admin = await getPrisma().adminUser.findUnique({
    where: { email: data.user.email },
  });

  if (!admin || admin.status !== "active") {
    await supabase.auth.signOut();
    redirect(
      `/admin/login?error=unauthorized&next=${encodeURIComponent(nextPath)}`,
    );
  }

  await getPrisma().adminUser.update({
    where: { id: admin.id },
    data: {
      authUserId: data.user.id,
      lastLoginAt: new Date(),
    },
  });

  redirect(nextPath);
}

function getSafeNextPath(
  value: FormDataEntryValue | string | null | undefined,
): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/admin";
  }

  if (value.startsWith("//") || value.startsWith("/admin/login")) {
    return "/admin";
  }

  return value;
}
