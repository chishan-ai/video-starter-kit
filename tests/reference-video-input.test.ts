import { describe, expect, it } from "vitest";
import { buildReferenceVideoInput, type ReferenceImage } from "../src/lib/prompt-enhancer";

function makeChar(images: ReferenceImage[]) {
  return { referenceImages: images };
}

function img(url: string, angle: ReferenceImage["angle"] = "front", label?: string): ReferenceImage {
  return { url, angle, label };
}

describe("buildReferenceVideoInput", () => {
  describe("kling provider", () => {
    it("should pick front-angle image as frontal_image_url", () => {
      const chars = [
        makeChar([
          img("side.jpg", "right"),
          img("front.jpg", "front"),
          img("back.jpg", "back"),
        ]),
      ];

      const result = buildReferenceVideoInput("kling", chars) as {
        elements: { frontal_image_url: string; reference_image_urls: string[] }[];
      };

      expect(result.elements[0].frontal_image_url).toBe("front.jpg");
    });

    it("should fallback to first image when no front angle exists", () => {
      const chars = [
        makeChar([
          img("custom1.jpg", "custom"),
          img("right.jpg", "right"),
        ]),
      ];

      const result = buildReferenceVideoInput("kling", chars) as {
        elements: { frontal_image_url: string; reference_image_urls: string[] }[];
      };

      expect(result.elements[0].frontal_image_url).toBe("custom1.jpg");
    });

    it("should extract URLs from structured images for reference_image_urls", () => {
      const chars = [
        makeChar([
          img("a.jpg", "front"),
          img("b.jpg", "right"),
          img("c.jpg", "back"),
        ]),
      ];

      const result = buildReferenceVideoInput("kling", chars) as {
        elements: { frontal_image_url: string; reference_image_urls: string[] }[];
      };

      expect(result.elements[0].reference_image_urls).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
    });

    it("should limit to 3 characters", () => {
      const chars = [
        makeChar([img("a.jpg", "front")]),
        makeChar([img("b.jpg", "front")]),
        makeChar([img("c.jpg", "front")]),
        makeChar([img("d.jpg", "front")]),
      ];

      const result = buildReferenceVideoInput("kling", chars) as {
        elements: { frontal_image_url: string }[];
      };

      expect(result.elements).toHaveLength(3);
    });

    it("should limit reference_image_urls to 3 per character", () => {
      const chars = [
        makeChar([
          img("1.jpg", "front"),
          img("2.jpg", "right"),
          img("3.jpg", "back"),
          img("4.jpg", "left"),
          img("5.jpg", "custom"),
        ]),
      ];

      const result = buildReferenceVideoInput("kling", chars) as {
        elements: { reference_image_urls: string[] }[];
      };

      expect(result.elements[0].reference_image_urls).toHaveLength(3);
    });
  });

  describe("vidu provider", () => {
    it("should extract all URLs and limit to 7", () => {
      const chars = [
        makeChar([img("a.jpg", "front"), img("b.jpg", "right"), img("c.jpg", "back")]),
        makeChar([img("d.jpg", "front"), img("e.jpg", "right"), img("f.jpg", "back")]),
        makeChar([img("g.jpg", "front"), img("h.jpg", "right"), img("i.jpg", "back")]),
      ];

      const result = buildReferenceVideoInput("vidu", chars) as {
        reference_image_urls: string[];
      };

      expect(result.reference_image_urls).toHaveLength(7);
      expect(result.reference_image_urls).toEqual([
        "a.jpg", "b.jpg", "c.jpg",
        "d.jpg", "e.jpg", "f.jpg",
        "g.jpg",
      ]);
    });

    it("should handle single character with one image", () => {
      const chars = [makeChar([img("only.jpg", "front")])];

      const result = buildReferenceVideoInput("vidu", chars) as {
        reference_image_urls: string[];
      };

      expect(result.reference_image_urls).toEqual(["only.jpg"]);
    });
  });
});
