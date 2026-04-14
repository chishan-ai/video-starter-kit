import { describe, expect, it } from "vitest";
import { CREDIT_COSTS } from "@/lib/credits";

describe("Cost estimation", () => {
  it("5 shots x vidu-q3-i2v (10 cr) = 50 credits", () => {
    const cost = 5 * CREDIT_COSTS["vidu-q3-i2v"];
    expect(cost).toBe(50);
  });

  it("3 shots x kling-3-pro-i2v (30 cr) = 90 credits", () => {
    const cost = 3 * CREDIT_COSTS["kling-3-pro-i2v"];
    expect(cost).toBe(90);
  });

  it("0 shots = 0 credits", () => {
    const cost = 0 * CREDIT_COSTS["vidu-q3-i2v"];
    expect(cost).toBe(0);
  });

  it("detects insufficient balance: 8 x kling (30) = 240 > balance 100", () => {
    const balance = 100;
    const totalCost = 8 * CREDIT_COSTS["kling-3-pro-i2v"];
    expect(totalCost).toBe(240);
    expect(totalCost).toBeGreaterThan(balance);
  });
});
