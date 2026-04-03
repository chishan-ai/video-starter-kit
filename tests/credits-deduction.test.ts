import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock drizzle-orm before importing credits module
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();
const mockReturning = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockSelect = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelectWhere = vi.fn();
const mockSelectLimit = vi.fn();

vi.mock("@/db", () => ({
  db: {
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return {
        set: (...sArgs: unknown[]) => {
          mockSet(...sArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return {
                returning: (...rArgs: unknown[]) => {
                  mockReturning(...rArgs);
                  return mockReturning.mock.results[
                    mockReturning.mock.results.length - 1
                  ]?.value ?? [];
                },
              };
            },
          };
        },
      };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockInsertValues(...vArgs);
        },
      };
    },
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockSelectFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockSelectWhere(...wArgs);
              return {
                limit: (...lArgs: unknown[]) => {
                  mockSelectLimit(...lArgs);
                  return mockSelectLimit.mock.results[
                    mockSelectLimit.mock.results.length - 1
                  ]?.value ?? [];
                },
              };
            },
          };
        },
      };
    },
  },
}));

vi.mock("@/db/schema", () => ({
  users: {
    id: "id",
    creditsBalance: "credits_balance",
  },
  creditTransactions: "credit_transactions",
}));

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ type: "eq", args }),
  and: (...args: unknown[]) => ({ type: "and", args }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: "sql",
    strings: [...strings],
    values,
  }),
}));

import { deductCredits, addCredits, getBalance, CREDIT_COSTS } from "../src/lib/credits";

describe("deductCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deduct credits and return new balance on success", async () => {
    mockReturning.mockReturnValueOnce([{ creditsBalance: 92 }]);

    const result = await deductCredits(
      "user-1",
      8,
      "generation",
      "Character design: Hero",
      "char-1",
    );

    expect(result).toEqual({ success: true, balance: 92 });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        amount: -8,
        type: "generation",
        description: "Character design: Hero",
        relatedId: "char-1",
      }),
    );
  });

  it("should return failure when balance is insufficient (no row updated)", async () => {
    // WHERE balance >= amount fails → no rows returned
    mockReturning.mockReturnValueOnce([]);
    // getBalance fallback query
    mockSelectLimit.mockReturnValueOnce([{ creditsBalance: 5 }]);

    const result = await deductCredits(
      "user-1",
      8,
      "generation",
      "Character design: Hero",
    );

    expect(result).toEqual({ success: false, balance: 5 });
    // Should NOT record a transaction
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("should not record transaction on insufficient balance", async () => {
    mockReturning.mockReturnValueOnce([]);
    mockSelectLimit.mockReturnValueOnce([{ creditsBalance: 0 }]);

    await deductCredits("user-1", 10, "generation", "test");

    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("addCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add credits and record refund transaction", async () => {
    mockReturning.mockReturnValueOnce([{ creditsBalance: 108 }]);

    const balance = await addCredits(
      "user-1",
      8,
      "refund",
      "Refund: design failed",
      "char-1",
    );

    expect(balance).toBe(108);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        amount: 8,
        type: "refund",
      }),
    );
  });
});

describe("getBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user balance", async () => {
    mockSelectLimit.mockReturnValueOnce([{ creditsBalance: 50 }]);

    const balance = await getBalance("user-1");
    expect(balance).toBe(50);
  });

  it("should return 0 when user not found", async () => {
    mockSelectLimit.mockReturnValueOnce([]);

    const balance = await getBalance("nonexistent");
    expect(balance).toBe(0);
  });
});

describe("CREDIT_COSTS", () => {
  it("should have character-design cost defined", () => {
    expect(CREDIT_COSTS["character-design"]).toBe(8);
  });

  it("should have all image generation model costs", () => {
    expect(CREDIT_COSTS["flux-kontext-pro"]).toBe(3);
    expect(CREDIT_COSTS["flux-kontext-max"]).toBe(5);
    expect(CREDIT_COSTS["kling-image-o1"]).toBe(2);
  });
});
