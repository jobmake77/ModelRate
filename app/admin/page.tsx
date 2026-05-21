import { getCurrentAdmin } from "@/lib/auth/admin";
import { getModelsWithCurrentPrices } from "@/lib/data-access/models";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  const models = await getModelsWithCurrentPrices();
  const pricedModels = models.filter((model) => model.currentPrice);

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

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-700">{admin.email}</p>
        <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Models" value={models.length} />
        <Metric label="Current prices" value={pricedModels.length} />
        <Metric label="Role" value={admin.role} />
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
        当前后台已覆盖模型、模型价格、中转站、中转站价格、指南、投稿审核和广告位配置。
        生产环境请先配置 Supabase Auth、数据库和管理员账号。
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
