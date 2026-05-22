import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/submissions/route";

const mocks = vi.hoisted(() => ({
  submissionCreate: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getPrisma: () => ({
    submission: {
      create: mocks.submissionCreate,
    },
  }),
  hasDatabaseUrl: true,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
  ),
}));

describe("public submission write hardening", () => {
  beforeEach(() => {
    mocks.submissionCreate.mockReset();
  });

  it("forces server-owned fields instead of trusting public input", async () => {
    mocks.submissionCreate.mockResolvedValue({
      id: "sub_1",
      status: "pending",
      createdAt: new Date("2026-05-22T00:00:00.000Z"),
    });

    const response = await POST(
      jsonRequest({
        type: "general_feedback",
        status: "approved",
        id: "attacker-controlled-id",
        reviewedBy: "attacker@example.com",
        submitterName: "  Alice  ",
        submitterEmail: "alice@example.com",
        payload: {
          subject: "Pricing correction",
          message: "This public write should not be able to approve itself.",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.submissionCreate).toHaveBeenCalledWith({
      data: {
        type: "general_feedback",
        status: "pending",
        submitterName: "Alice",
        submitterEmail: "alice@example.com",
        payload: {
          subject: "Pricing correction",
          message: "This public write should not be able to approve itself.",
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  });

  it("rejects invalid payloads without touching the database", async () => {
    const response = await POST(
      jsonRequest({
        type: "general_feedback",
        payload: {
          subject: "No",
          message: "too short",
          sourceUrl: "javascript:alert(1)",
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.submissionCreate).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("https://modelrate.test/api/submissions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
