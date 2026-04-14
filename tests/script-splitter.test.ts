import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@/lib/gemini", () => ({
  getGeminiModel: () => ({
    generateContent: mockGenerateContent,
  }),
}));

import { splitScript } from "@/lib/script-splitter";

function geminiResponse(json: object) {
  return {
    response: {
      text: () => JSON.stringify(json),
    },
  };
}

describe("splitScript", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it("returns shots with narrativeIntent, cameraReason, and scriptType", async () => {
    mockGenerateContent.mockResolvedValue(
      geminiResponse({
        scriptType: "narrative",
        shots: [
          {
            order: 0,
            description: "A hero stands on a cliff at dawn",
            cameraType: "wide",
            duration: 5,
            characterIds: ["char-1"],
            narrativeIntent: "establishing",
            cameraReason: "Wide shot to set the scene",
          },
          {
            order: 1,
            description: "Close-up of the hero's determined face",
            cameraType: "close-up",
            duration: 4,
            characterIds: ["char-1"],
            narrativeIntent: "emotional_climax",
            cameraReason: "Intimate framing for emotion",
          },
        ],
        totalDuration: 9,
        summary: "A hero's journey begins",
      }),
    );

    const result = await splitScript("A hero stands...", "anime", [
      { id: "char-1", name: "Hero", promptTag: "tall warrior" },
    ]);

    expect(result.scriptType).toBe("narrative");
    expect(result.shots[0].narrativeIntent).toBe("establishing");
    expect(result.shots[0].cameraReason).toBe("Wide shot to set the scene");
    expect(result.shots[1].narrativeIntent).toBe("emotional_climax");
  });

  it("each shot has valid cameraType", async () => {
    mockGenerateContent.mockResolvedValue(
      geminiResponse({
        shots: [
          { order: 0, description: "Shot 1", cameraType: "wide", duration: 4, characterIds: [] },
          { order: 1, description: "Shot 2", cameraType: "close-up", duration: 4, characterIds: [] },
          { order: 2, description: "Shot 3", cameraType: "overhead", duration: 4, characterIds: [] },
        ],
        totalDuration: 12,
        summary: "Test",
      }),
    );

    const result = await splitScript("Test script", "anime", []);
    const validTypes = ["wide", "medium", "close-up", "overhead", "low-angle"];
    for (const shot of result.shots) {
      expect(validTypes).toContain(shot.cameraType);
    }
  });

  it("clamps duration to 3-10 range", async () => {
    mockGenerateContent.mockResolvedValue(
      geminiResponse({
        shots: [
          { order: 0, description: "Too short", cameraType: "wide", duration: 1, characterIds: [] },
          { order: 1, description: "Too long", cameraType: "medium", duration: 15, characterIds: [] },
          { order: 2, description: "Normal", cameraType: "close-up", duration: 5, characterIds: [] },
        ],
        totalDuration: 21,
        summary: "Duration test",
      }),
    );

    const result = await splitScript("Test", "anime", []);
    expect(result.shots[0].duration).toBe(3);
    expect(result.shots[1].duration).toBe(10);
    expect(result.shots[2].duration).toBe(5);
    expect(result.totalDuration).toBe(18);
  });

  it("works with empty characters array", async () => {
    mockGenerateContent.mockResolvedValue(
      geminiResponse({
        shots: [
          { order: 0, description: "A landscape at sunset", cameraType: "wide", duration: 4, characterIds: [] },
        ],
        totalDuration: 4,
        summary: "Landscape shot",
      }),
    );

    const result = await splitScript("A beautiful landscape", "anime", []);
    expect(result.shots).toHaveLength(1);
    expect(result.shots[0].characterIds).toEqual([]);
  });

  it("throws on invalid JSON from Gemini", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "This is plain text with no JSON structure at all",
      },
    });

    await expect(splitScript("Test", "anime", [])).rejects.toThrow(
      "Failed to parse",
    );
  });
});
