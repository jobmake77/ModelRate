import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getAdminAdPlacements } from "@/lib/data-access/ad-placements";
import {
  getDataQualitySummary,
  type DataQualityItem,
} from "@/lib/data-access/data-quality";
import { getAdminGuides } from "@/lib/data-access/guides";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";
import { getAdminRelayStations } from "@/lib/data-access/relays";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">需要管理员登录</h1>
        <p className="mt-2 text-sm text-amber-800">
          生产环境会通过 Supabase Auth 校验管理员身份。请配置 Supabase
          环境变量后登录。
        </p>
      </section>
    );
  }

  const [models, relays, guides, adPlacements, pendingSubmissions, quality] =
    await Promise.all([
      getModelsWithCurrentPrices(),
      getAdminRelayStations(),
      getAdminGuides(),
      getAdminAdPlacements(),
      getPendingSubmissionCount(),
      getDataQualitySummary(),
    ]);
  const pricedModels = models.filter((model) => model.currentPrice);
  const publishedRelays = relays.filter(
    (relay) => relay.status === "published",
  );
  const publishedGuides = guides.filter(
    (guide) => guide.status === "published",
  );
  const enabledAds = adPlacements.filter((placement) => placement.isEnabled);

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-700">{admin.email}</p>
        <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          detail={`${pricedModels.length} with current price`}
          label="Models"
          value={models.length}
        />
        <Metric
          detail={`${publishedRelays.length} published`}
          label="Relay stations"
          value={relays.length}
        />
        <Metric
          detail={`${publishedGuides.length} published`}
          label="Guides"
          value={guides.length}
        />
        <Metric
          detail="awaiting review"
          label="Pending submissions"
          value={pendingSubmissions}
        />
        <Metric
          detail={`${enabledAds.length} enabled`}
          label="Ad placements"
          value={adPlacements.length}
        />
        <Metric detail="current session" label="Role" value={admin.role} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
        当前后台已覆盖模型、模型价格、中转站、中转站价格、指南、投稿审核和广告位配置。
        生产环境请先配置 Supabase Auth、数据库和管理员账号。
      </div>

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-xl font-semibold">Data Quality</h2>
          <p className="mt-1 text-sm text-slate-600">
            上线前优先处理非零项，避免公开页面展示过期、缺来源或缺复核时间的数据。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quality.map((item) => (
            <QualityMetric item={item} key={item.label} />
          ))}
        </div>
      </section>
    </div>
  );
}

async function getPendingSubmissionCount() {
  if (!hasDatabaseUrl) {
    return 0;
  }

  return getPrisma().submission.count({ where: { status: "pending" } });
}

function Metric({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function QualityMetric({ item }: { item: DataQualityItem }) {
  const toneClass =
    item.tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-green-200 bg-green-50 text-green-950";

  return (
    <Link
      className={`rounded-lg border p-5 shadow-sm transition hover:shadow-md ${toneClass}`}
      href={item.href}
    >
      <div className="text-sm">{item.label}</div>
      <div className="mt-2 text-3xl font-semibold">{item.value}</div>
      <div className="mt-2 text-xs opacity-80">{item.detail}</div>
    </Link>
  );
}
