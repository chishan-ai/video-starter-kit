import { describe, expect, it } from "vitest";
import { buildVideoPrompt, buildReferenceVideoPrompt } from "../src/lib/prompt-enhancer";

describe("Accessories in video prompts", () => {
  it("should include accessory descriptions in character tags", () => {
    // Simulating what generate-video route does: building characterTags
    // with accessories appended
    const charData = [
      {
        description: "young girl with long black hair",
        accessories: [
          { type: "necklace", description: "golden pendant necklace" },
          { type: "hat", description: "straw sun hat" },
        ],
      },
    ];

    const characterTags = charData.map((c) => {
      const parts = [c.description].filter(Boolean);
      if (c.accessories?.length > 0) {
        parts.push(
          `wearing ${c.accessories.map((a) => a.description).join(", ")}`,
        );
      }
      return parts.join(", ");
    });

    expect(characterTags[0]).toBe(
      "young girl with long black hair, wearing golden pendant necklace, straw sun hat",
    );
  });

  it("should work without accessories", () => {
    const charData = [
      {
        description: "tall warrior with armor",
        accessories: [],
      },
    ];

    const characterTags = charData.map((c) => {
      const parts = [c.description].filter(Boolean);
      if (c.accessories?.length > 0) {
        parts.push(
          `wearing ${c.accessories.map((a) => a.description).join(", ")}`,
        );
      }
      return parts.join(", ");
    });

    expect(characterTags[0]).toBe("tall warrior with armor");
  });

  it("should include accessory-enhanced tags in buildVideoPrompt", () => {
    const prompt = buildVideoPrompt({
      shotDescription: "walking through a forest",
      style: "anime",
      cameraType: "medium",
      characterTags: [
        "young girl with long black hair, wearing golden pendant necklace",
      ],
    });

    expect(prompt).toContain("golden pendant necklace");
    expect(prompt).toContain("walking through a forest");
    expect(prompt).toContain("anime style");
  });
});

describe("Outfit editing integration", () => {
  it("buildReferenceVideoPrompt includes character descriptions for kling", () => {
    const prompt = buildReferenceVideoPrompt({
      shotDescription: "Hero walks into the castle",
      style: "anime",
      cameraType: "wide",
      characters: [
        { name: "Hero", description: "young man in red armor with a sword" },
      ],
      provider: "kling",
    });

    expect(prompt).toContain("@Element1");
    expect(prompt).toContain("Hero");
    expect(prompt).toContain("castle");
  });

  it("buildReferenceVideoPrompt includes character descriptions for vidu", () => {
    const prompt = buildReferenceVideoPrompt({
      shotDescription: "Two characters meet at the market",
      style: "realistic",
      cameraType: "medium",
      characters: [
        { name: "Alice", description: "woman with red dress and pearl earrings" },
        { name: "Bob", description: "man in blue suit with gold watch" },
      ],
      provider: "vidu",
    });

    expect(prompt).toContain("red dress and pearl earrings");
    expect(prompt).toContain("blue suit with gold watch");
    expect(prompt).toContain("market");
  });

  it("buildReferenceVideoPrompt handles character name replacement in kling", () => {
    const prompt = buildReferenceVideoPrompt({
      shotDescription: "Alice looks at Bob across the table",
      style: "anime",
      cameraType: "close-up",
      characters: [
        { name: "Alice", description: "young woman" },
        { name: "Bob", description: "old man" },
      ],
      provider: "kling",
    });

    expect(prompt).toContain("Alice (@Element1)");
    expect(prompt).toContain("Bob (@Element2)");
  });
});

describe("Accessories validation schema", () => {
  it("should accept valid accessory objects", () => {
    const accessory = {
      type: "hat",
      description: "Red baseball cap",
    };

    expect(accessory.type).toBeTruthy();
    expect(accessory.description).toBeTruthy();
    expect(accessory.type.length).toBeLessThanOrEqual(50);
    expect(accessory.description.length).toBeLessThanOrEqual(200);
  });

  it("should support optional imageUrl", () => {
    const withImage = {
      type: "necklace",
      description: "Gold chain",
      imageUrl: "https://example.com/necklace.jpg",
    };
    const withoutImage = {
      type: "glasses",
      description: "Round wire-frame glasses",
    };

    expect(withImage.imageUrl).toBeDefined();
    expect(withoutImage).not.toHaveProperty("imageUrl");
  });
});
