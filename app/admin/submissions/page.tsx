import { getCurrentAdmin } from "@/lib/auth/admin";
import {
  AdminSubmissionRow,
  SubmissionsPanel,
} from "@/components/admin/submissions-panel";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";

export default async function AdminSubmissionsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-950">Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">请先以管理员身份登录。</p>
      </section>
    );
  }

  const submissions = await getSubmissions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Submissions</h1>
        <p className="mt-2 text-sm text-slate-600">
          投稿和纠错默认进入 pending 队列，审核后再进入正式业务数据。
        </p>
      </div>

      <SubmissionsPanel
        databaseConfigured={hasDatabaseUrl}
        initialSubmissions={submissions}
      />
    </div>
  );
}

async function getSubmissions(): Promise<AdminSubmissionRow[]> {
  if (!hasDatabaseUrl) {
    return [];
  }

  const submissions = await getPrisma().submission.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return submissions.map((submission) => {
    const payload = submission.payload as {
      message?: string;
      sourceUrl?: string;
      subject?: string;
    };

    return {
      id: submission.id,
      type: submission.type,
      status: submission.status,
      submitterEmail: submission.submitterEmail,
      subject: payload.subject ?? "Untitled submission",
      message: payload.message ?? "",
      sourceUrl: payload.sourceUrl ?? null,
      reviewNotes: submission.reviewNotes,
      createdAt: submission.createdAt.toISOString(),
    };
  });
}
