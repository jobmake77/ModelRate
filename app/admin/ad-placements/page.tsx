import { getCurrentAdmin } from "@/lib/auth/admin";
import { AdPlacementsPanel } from "@/components/admin/ad-placements-panel";
import { getAdminAdPlacements } from "@/lib/data-access/ad-placements";
import { hasDatabaseUrl } from "@/lib/db/client";

export default async function AdminAdPlacementsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
      </section>
    );
  }

  const placements = await getAdminAdPlacements();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Ad Placements</h1>
        <p className="mt-2 text-sm text-slate-600">
          配置广告位和广告占位内容。V1 默认关闭广告，不正式启用 AdSense。
        </p>
      </div>
      <AdPlacementsPanel
        databaseConfigured={hasDatabaseUrl}
        initialPlacements={placements}
      />
    </div>
  );
}
