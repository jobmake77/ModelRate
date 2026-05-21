import { getCurrentAdmin } from "@/lib/auth/admin";
import { RelayAdminPanel } from "@/components/admin/relay-admin-panel";
import { getAdminRelayStations } from "@/lib/data-access/relays";
import { hasDatabaseUrl } from "@/lib/db/client";

export default async function AdminRelaysPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
      </section>
    );
  }

  const relays = await getAdminRelayStations();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Relay Stations</h1>
        <p className="mt-2 text-sm text-slate-600">
          管理中转站基础信息、发布状态、风险等级和商业标记。公开目录只展示
          published 中转站。
        </p>
      </div>
      <RelayAdminPanel
        databaseConfigured={hasDatabaseUrl}
        initialRelays={relays}
      />
    </div>
  );
}
