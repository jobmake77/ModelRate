import { getCurrentAdmin } from "@/lib/auth/admin";
import { getPrisma, hasDatabaseUrl } from "@/lib/db/client";
import { formatDate } from "@/lib/formatters/number";

type SubmissionRow = {
  id: string;
  type: string;
  status: string;
  submitterEmail: string | null;
  subject: string;
  createdAt: string;
};

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

      {!hasDatabaseUrl ? (
        <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          数据库环境变量尚未配置，当前只能验证提交格式，不能展示真实队列。
        </section>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitter</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length ? (
                submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-4 py-4 font-medium">
                      {submission.subject}
                    </td>
                    <td className="px-4 py-4">{submission.type}</td>
                    <td className="px-4 py-4">{submission.status}</td>
                    <td className="px-4 py-4">
                      {submission.submitterEmail ?? "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(submission.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

async function getSubmissions(): Promise<SubmissionRow[]> {
  if (!hasDatabaseUrl) {
    return [];
  }

  const submissions = await getPrisma().submission.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return submissions.map((submission) => {
    const payload = submission.payload as { subject?: string };

    return {
      id: submission.id,
      type: submission.type,
      status: submission.status,
      submitterEmail: submission.submitterEmail,
      subject: payload.subject ?? "Untitled submission",
      createdAt: submission.createdAt.toISOString(),
    };
  });
}
