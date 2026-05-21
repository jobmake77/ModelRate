import { GuideAdminPanel } from "@/components/admin/guide-admin-panel";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getAdminGuides } from "@/lib/data-access/guides";
import { hasDatabaseUrl } from "@/lib/db/client";

export default async function AdminGuidesPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
      </section>
    );
  }

  const guides = await getAdminGuides();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Guides</h1>
        <p className="mt-2 text-sm text-slate-600">
          管理公开指南文章。published 文章会进入公开指南列表、详情页和 sitemap。
        </p>
      </div>
      <GuideAdminPanel
        databaseConfigured={hasDatabaseUrl}
        initialGuides={guides}
      />
    </div>
  );
}
