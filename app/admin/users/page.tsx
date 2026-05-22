import {
  AdminUsersPanel,
  type AdminUserRow,
} from "@/components/admin/admin-users-panel";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();

  if (!admin || admin.role !== "owner") {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Forbidden</h1>
        <p className="mt-2 text-sm text-amber-800">
          只有 owner 可以维护后台用户。
        </p>
      </section>
    );
  }

  const users = await getAdminUsers(admin);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Admin Users</h1>
        <p className="mt-2 text-sm text-slate-600">
          管理 Supabase Auth 用户和 ModelRate 后台角色。Supabase Auth
          账号存在不代表自动拥有后台权限，必须在这里授权。
        </p>
      </div>
      <AdminUsersPanel
        databaseConfigured={hasDatabaseUrl}
        initialUsers={users}
      />
    </div>
  );
}

async function getAdminUsers(admin: {
  email: string;
  id: string;
  role: string;
  status: string;
}): Promise<AdminUserRow[]> {
  if (!hasDatabaseUrl) {
    return [
      {
        authUserId: null,
        createdAt: new Date().toISOString(),
        email: admin.email,
        id: admin.id,
        lastLoginAt: null,
        name: "Development admin",
        role: "owner",
        status: "active",
      },
    ];
  }

  const users = await getPrisma().adminUser.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return users.map((user) => ({
    authUserId: user.authUserId,
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    name: user.name,
    role: user.role,
    status: user.status,
  }));
}
