import { describe, expect, it } from "vitest";
import {
  composeVideoPrompt,
  composeReferenceVideoPrompt,
} from "@/lib/prompt-composer";

describe("composeVideoPrompt", () => {
  const baseCtx = {
    shotDescription: "A warrior stands on a cliff at dawn",
    style: "anime",
    cameraType: "wide",
    characterTags: ["tall warrior with silver armor"],
  };

  it("with narrativeIntent 'establishing' includes cinematic establishing shot", () => {
    const result = composeVideoPrompt({
      ...baseCtx,
      narrativeIntent: "establishing",
    });
    expect(result).toContain("cinematic establishing shot");
  });

  it("with narrativeIntent 'emotional_climax' includes intimate framing", () => {
    const result = composeVideoPrompt({
      ...baseCtx,
      narrativeIntent: "emotional_climax",
    });
    expect(result).toContain("intimate framing, emotional depth");
  });

  it("without narrativeIntent falls back to basic prompt", () => {
    const result = composeVideoPrompt(baseCtx);
    expect(result).toContain("A warrior stands on a cliff at dawn");
    expect(result).not.toContain("cinematic establishing shot");
    expect(result).not.toContain("intimate framing");
  });

  it("with unknown narrativeIntent falls back without crashing", () => {
    const result = composeVideoPrompt({
      ...baseCtx,
      narrativeIntent: "nonexistent_intent",
    });
    expect(result).toContain("A warrior stands on a cliff at dawn");
    expect(result).not.toContain("cinematic");
  });

  it("includes camera modifier for different camera types", () => {
    const closeUp = composeVideoPrompt({
      ...baseCtx,
      cameraType: "close-up",
    });
    expect(closeUp).toContain("close-up shot");

    const overhead = composeVideoPrompt({
      ...baseCtx,
      cameraType: "overhead",
    });
    expect(overhead).toContain("overhead aerial shot");

    const lowAngle = composeVideoPrompt({
      ...baseCtx,
      cameraType: "low-angle",
    });
    expect(lowAngle).toContain("low angle shot");
  });
});

describe("composeReferenceVideoPrompt", () => {
  it("with narrativeIntent includes narrative modifier for kling provider", () => {
    const result = composeReferenceVideoPrompt({
      shotDescription: "Hero walks through rain",
      style: "anime",
      cameraType: "medium",
      characters: [{ name: "Hero", description: "tall warrior in armor" }],
      provider: "kling",
      narrativeIntent: "rising_action",
    });
    expect(result).toContain("dynamic composition, building tension");
  });
});
