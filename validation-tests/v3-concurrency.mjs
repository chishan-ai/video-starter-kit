/**
 * Phase 0 — V3: Concurrency & Rate Limit Test
 *
 * Submit 10 video generation requests in parallel to test:
 * 1. fal.ai rate limits
 * 2. Queue behavior under load
 * 3. Vidu Q3 vs Kling 3.0 comparison
 */

import { createFalClient } from "@fal-ai/client";

const fal = createFalClient({
  credentials: process.env.FAL_KEY,
});

// Same character image from V1 test
const CHARACTER_URL = "https://v3b.fal.media/files/b/0a93b96d/EiwtsB4RINbQiA_fLXUUl.jpg";

const SCENES = [
  "anime girl in library reading a book, soft light",
  "anime girl on train looking out window, evening",
  "anime girl cooking in kitchen, cheerful mood",
  "anime girl playing guitar on stage, spotlight",
  "anime girl at beach watching sunset, peaceful",
];

async function submitJob(model, prompt, imageUrl, label) {
  const start = Date.now();
  try {
    const input = imageUrl
      ? { prompt, image_url: imageUrl }
      : { prompt };

    const result = await fal.subscribe(model, { input, logs: false });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const videoUrl = result.data.video?.url || "no-url";
    const fileSize = result.data.video?.file_size
      ? (result.data.video.file_size / 1024 / 1024).toFixed(1) + "MB"
      : "?";
    console.log(`  ✅ ${label} — ${elapsed}s — ${fileSize} — ${videoUrl}`);
    return { label, status: "ok", elapsed, videoUrl, fileSize };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ❌ ${label} — ${elapsed}s — ${err.message}`);
    return { label, status: "fail", elapsed, error: err.message };
  }
}

async function main() {
  console.log("=== Mozoria Phase 0 — V3: Concurrency Test ===");
  console.log(`Date: ${new Date().toISOString()}\n`);

  // --- TEST 1: 5 concurrent Vidu Q3 image-to-video ---
  console.log("TEST 1: 5x parallel Vidu Q3 image-to-video");
  console.log("Character:", CHARACTER_URL);
  const t1Start = Date.now();

  const viduJobs = SCENES.map((scene, i) =>
    submitJob(
      "fal-ai/vidu/q3/image-to-video",
      scene,
      CHARACTER_URL,
      `Vidu-${i + 1}`
    )
  );
  const viduResults = await Promise.all(viduJobs);
  const t1Elapsed = ((Date.now() - t1Start) / 1000).toFixed(0);
  const viduOk = viduResults.filter(r => r.status === "ok").length;
  console.log(`\nVidu batch: ${viduOk}/5 success, total wall time: ${t1Elapsed}s\n`);

  // --- TEST 2: 3 concurrent Kling 3.0 Pro image-to-video ---
  console.log("TEST 2: 3x parallel Kling 3.0 Pro image-to-video");
  const t2Start = Date.now();

  const klingJobs = SCENES.slice(0, 3).map((scene, i) =>
    submitJob(
      "fal-ai/kling-video/v3/pro/image-to-video",
      scene,
      CHARACTER_URL,
      `Kling-${i + 1}`
    )
  );
  const klingResults = await Promise.all(klingJobs);
  const t2Elapsed = ((Date.now() - t2Start) / 1000).toFixed(0);
  const klingOk = klingResults.filter(r => r.status === "ok").length;
  console.log(`\nKling batch: ${klingOk}/3 success, total wall time: ${t2Elapsed}s\n`);

  // --- TEST 3: 2 concurrent Vidu Q3 text-to-video (no image ref) ---
  console.log("TEST 3: 2x parallel Vidu Q3 text-to-video (no image ref)");
  const t3Start = Date.now();

  const t2vJobs = [
    submitJob("fal-ai/vidu/q3/text-to-video", "anime girl with pink twin tails running through rain, dramatic lighting, anime style", null, "T2V-1"),
    submitJob("fal-ai/vidu/q3/text-to-video", "anime girl with pink twin tails sitting on rooftop at night, stars in sky, anime style", null, "T2V-2"),
  ];
  const t2vResults = await Promise.all(t2vJobs);
  const t3Elapsed = ((Date.now() - t3Start) / 1000).toFixed(0);
  console.log(`\nText-to-video batch: ${t2vResults.filter(r => r.status === "ok").length}/2 success, wall time: ${t3Elapsed}s\n`);

  // --- SUMMARY ---
  const allResults = [...viduResults, ...klingResults, ...t2vResults];
  const totalOk = allResults.filter(r => r.status === "ok").length;
  const totalFail = allResults.filter(r => r.status === "fail").length;

  console.log("=== FINAL SUMMARY ===");
  console.log(`Total: ${totalOk} success, ${totalFail} failed, out of ${allResults.length}`);
  console.log(`\nVidu Q3 (i2v, 5 parallel): ${viduOk}/5 — wall time ${t1Elapsed}s`);
  console.log(`Kling 3.0 (i2v, 3 parallel): ${klingOk}/3 — wall time ${t2Elapsed}s`);
  console.log(`Vidu Q3 (t2v, 2 parallel): ${t2vResults.filter(r => r.status === "ok").length}/2 — wall time ${t3Elapsed}s`);

  if (totalFail > 0) {
    console.log("\nFailed jobs:");
    for (const r of allResults.filter(r => r.status === "fail")) {
      console.log(`  ${r.label}: ${r.error}`);
    }
  }

  console.log("\nKling video URLs (compare quality vs Vidu):");
  for (const r of klingResults.filter(r => r.videoUrl)) {
    console.log(`  ${r.label}: ${r.videoUrl}`);
  }

  // Save
  const fs = await import("fs");
  fs.writeFileSync("./validation-tests/v3-results.json", JSON.stringify({
    timestamp: new Date().toISOString(),
    vidu: { results: viduResults, wallTime: t1Elapsed },
    kling: { results: klingResults, wallTime: t2Elapsed },
    t2v: { results: t2vResults, wallTime: t3Elapsed },
  }, null, 2));
  console.log("\nResults saved to v3-results.json");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
