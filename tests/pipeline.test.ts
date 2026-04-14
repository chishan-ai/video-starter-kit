import { describe, expect, it, vi, beforeEach } from "vitest";

// --- Mocks ---

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock("@/db/schema", () => ({
  shots: { id: "shots.id" },
  characters: { id: "characters.id" },
  projects: { id: "projects.id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock("@/lib/credits", () => ({
  CREDIT_COSTS: {
    "vidu-q3-i2v": 10,
    "vidu-q3-t2v": 10,
    "kling-3-pro-i2v": 30,
    "kling-3-pro-t2v": 30,
  },
  deductCredits: vi.fn(),
  addCredits: vi.fn(),
}));

vi.mock("@/lib/fal-server", () => ({
  falServer: { queue: { submit: vi.fn() } },
  getModelEndpoint: vi.fn(() => "fal-ai/vidu/q3/text-to-video"),
  isReferenceModel: vi.fn(() => false),
}));

vi.mock("@/lib/prompt-composer", () => ({
  composeVideoPrompt: vi.fn(() => "mocked prompt"),
  composeReferenceVideoPrompt: vi.fn(() => "mocked ref prompt"),
}));

vi.mock("@/lib/prompt-enhancer", () => ({
  buildReferenceVideoInput: vi.fn(() => ({})),
}));

// --- Imports (after mocks) ---

import {
  generateShotsPipeline,
  type PipelineParams,
} from "@/lib/pipeline";
import { deductCredits, addCredits } from "@/lib/credits";
import { falServer } from "@/lib/fal-server";

// --- Helpers ---

function makeParams(shotCount: number): PipelineParams {
  return {
    userId: "user-1",
    projectId: "proj-1",
    modelKey: "vidu-q3-t2v",
    shots: Array.from({ length: shotCount }, (_, i) => ({
      id: `shot-${i}`,
      description: `Shot ${i} visual description`,
      cameraType: "wide",
      characterIds: [],
      narrativeIntent: null,
    })),
    project: { id: "proj-1", style: "anime" },
  };
}

// --- Tests ---

describe("generateShotsPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: 3 shots all succeed", async () => {
    vi.mocked(deductCredits).mockResolvedValue({ success: true, balance: 100 });
    vi.mocked(falServer.queue.submit)
      .mockResolvedValueOnce({ request_id: "req-0" } as any)
      .mockResolvedValueOnce({ request_id: "req-1" } as any)
      .mockResolvedValueOnce({ request_id: "req-2" } as any);

    const result = await generateShotsPipeline(makeParams(3));

    expect(result.submitted).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.jobs).toHaveLength(3);
    expect(result.jobs.every((j) => j.requestId)).toBe(true);
  });

  it("one shot fails fal submit — gets refunded, others succeed", async () => {
    vi.mocked(deductCredits).mockResolvedValue({ success: true, balance: 100 });
    vi.mocked(falServer.queue.submit)
      .mockResolvedValueOnce({ request_id: "req-0" } as any)
      .mockResolvedValueOnce({ request_id: "req-1" } as any)
      .mockRejectedValueOnce(new Error("fal API error"));

    const result = await generateShotsPipeline(makeParams(3));

    expect(result.submitted).toBe(2);
    expect(result.failed).toBe(1);
    expect(addCredits).toHaveBeenCalledOnce();
  });

  it("deductCredits fails for a shot — skipped, no fal submit", async () => {
    vi.mocked(deductCredits)
      .mockResolvedValueOnce({ success: true, balance: 90 })
      .mockResolvedValueOnce({ success: true, balance: 80 })
      .mockResolvedValueOnce({ success: false, balance: 5 });
    vi.mocked(falServer.queue.submit)
      .mockResolvedValueOnce({ request_id: "req-0" } as any)
      .mockResolvedValueOnce({ request_id: "req-1" } as any);

    const result = await generateShotsPipeline(makeParams(3));

    expect(result.submitted).toBe(2);
    expect(result.failed).toBe(1);
    expect(falServer.queue.submit).toHaveBeenCalledTimes(2);
  });

  it("no pending shots — returns empty result", async () => {
    const result = await generateShotsPipeline(makeParams(0));

    expect(result.submitted).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.jobs).toHaveLength(0);
  });
});
