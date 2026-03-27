import { describe, expect, it } from "vitest";
import { CREDIT_COSTS } from "../src/lib/credits";

describe("CREDIT_COSTS", () => {
	it("should have correct costs for video generation models", () => {
		expect(CREDIT_COSTS["vidu-q3-i2v"]).toBe(10);
		expect(CREDIT_COSTS["vidu-q3-t2v"]).toBe(10);
		expect(CREDIT_COSTS["kling-3-pro-i2v"]).toBe(30);
		expect(CREDIT_COSTS["kling-3-pro-t2v"]).toBe(30);
	});

	it("should have lower costs for image and TTS", () => {
		expect(CREDIT_COSTS["flux-schnell"]).toBe(1);
		expect(CREDIT_COSTS["f5-tts"]).toBe(2);
	});

	it("should charge more for higher quality exports", () => {
		expect(CREDIT_COSTS["export-1080p"]).toBeGreaterThan(
			CREDIT_COSTS["export-720p"],
		);
	});
});
