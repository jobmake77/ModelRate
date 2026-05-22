"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-950">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
          <p className="text-sm font-medium text-red-700">Application error</p>
          <h1 className="mt-3 text-3xl font-semibold">页面暂时无法打开</h1>
          <p className="mt-4 leading-7 text-slate-600">
            系统已经记录这个错误。你可以稍后重试，或返回上一页继续浏览。
          </p>
          <button
            className="mt-6 w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            onClick={reset}
            type="button"
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
