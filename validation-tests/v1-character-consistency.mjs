/**
 * Phase 0 — V1: Character Consistency Validation
 *
 * Generate 1 anime character, then 5 shots with Vidu Q3 image-to-video.
 * Uses minimal params (no resolution/duration overrides) to avoid 422 errors.
 */

import { createFalClient } from "@fal-ai/client";

const fal = createFalClient({
  credentials: process.env.FAL_KEY,
});

async function generateCharacterImage() {
  console.log("\n=== STEP 1: Generating character reference image ===");
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt:
        "anime girl character, pink hair in twin tails, bright blue eyes, dark blue school uniform with white collar, determined expression, front-facing portrait, clean white background, anime style",
      image_size: "square",
      num_images: 1,
    },
    logs: false,
  });
  const url = result.data.images[0].url;
  console.log(`✅ Character image: ${url}`);
  return url;
}

async function generateShot(characterUrl, scenePrompt, shotNum) {
  console.log(`\n--- Shot ${shotNum}/5: ${scenePrompt.slice(0, 60)}... ---`);
  const start = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/vidu/q3/image-to-video", {
      input: {
        prompt: scenePrompt,
        image_url: characterUrl,
      },
      logs: false,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const videoUrl = result.data.video.url;
    const fileSize = (result.data.video.file_size / 1024 / 1024).toFixed(1);
    console.log(`✅ Shot ${shotNum} done in ${elapsed}s (${fileSize}MB)`);
    console.log(`   ${videoUrl}`);
    return { shot: shotNum, status: "ok", videoUrl, elapsed, fileSize };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`❌ Shot ${shotNum} failed in ${elapsed}s: ${err.message}`);
    return { shot: shotNum, status: "fail", error: err.message, elapsed };
  }
}

async function main() {
  console.log("=== Mozoria Phase 0 — V1: Character Consistency ===");
  console.log(`Date: ${new Date().toISOString()}\n`);

  const charUrl = await generateCharacterImage();

  const scenes = [
    "anime girl walking through cherry blossom garden, wind blowing petals, wide shot, anime style",
    "anime girl sitting at school desk studying, close-up, warm afternoon light, anime style",
    "anime girl running on rooftop at sunset, dynamic action, side view, anime style",
    "anime girl standing in rain holding umbrella, medium shot, moody blue light, anime style",
    "anime girl smiling and waving at camera, close-up portrait, bright background, anime style",
  ];

  // Run sequentially to be safe with rate limits
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const r = await generateShot(charUrl, scenes[i], i + 1);
    results.push(r);
  }

  // Summary
  const ok = results.filter((r) => r.status === "ok");
  console.log("\n=== SUMMARY ===");
  console.log(`Character: ${charUrl}`);
  console.log(`Shots: ${ok.length}/${results.length} successful\n`);

  console.log("Video URLs (open in browser to compare consistency):");
  for (const r of results) {
    if (r.videoUrl) console.log(`  Shot ${r.shot}: ${r.videoUrl}`);
  }

  console.log("\nConsistency checklist:");
  console.log("  [ ] Hair color/style (pink twin tails)");
  console.log("  [ ] Eye color (blue)");
  console.log("  [ ] Clothing (dark blue uniform)");
  console.log("  [ ] Face shape");
  console.log("  [ ] Overall score: __/10");

  // Save results
  const fs = await import("fs");
  const report = { timestamp: new Date().toISOString(), charUrl, results };
  fs.writeFileSync(
    "./validation-tests/v1-results.json",
    JSON.stringify(report, null, 2),
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
