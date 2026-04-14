# TODOS

Deferred items from plan reviews. Re-evaluate at each phase gate.

## Phase 2 (after 10 repeat users)

### Native API Migration
- **Trigger:** Vidu native API price drops below fal.ai ($0.035/sec), or Kling removes $4,200 minimum package
- **Why deferred:** fal.ai is cheaper or equal for Phase 1. Kling native requires $4,200 min purchase (vs $100 Phase 1 budget). Eng review 2026-03-30.
- **Impact:** Reduces third-party dependency, potentially lower cost at scale

### Serialization Memory
- **Trigger:** Phase 1 hits 10 repeat users
- **Why deferred:** Validate single-generation value first. Character pack + style + world-building persistence across episodes.
- **Impact:** Core long-term differentiation for serial anime

### One-Click Social Media Publishing
- **Trigger:** Phase 1 validation complete
- **Why deferred:** Phase 1 focus is "will anyone use this twice", not publish flow optimization
- **Impact:** YouTube API + TikTok API integration

### Stripe Billing
- **Trigger:** Phase 2 start
- **Why deferred:** Phase 1 is free ($100 budget validation). No revenue until validated.
- **Impact:** Credits or subscription billing

### Content Moderation
- **Trigger:** User base > 50 or content policy incident
- **Why deferred:** Phase 1 relies on Kling/Vidu + Gemini built-in safety filters. Small user base.
- **Impact:** Explicit moderation layer + user reporting

### TTS / Audio
- **Trigger:** Phase 2
- **Why deferred:** CEO plan: no audio in Phase 1
- **Impact:** Voice acting, BGM, sound effects

### Pricing Research
- **Trigger:** Independent workstream
- **Why deferred:** User wants separate research track. Cost is #1 user concern.
- **Impact:** MkAnime/AnimateAI/MagicLight pricing + creator willingness-to-pay

## Technical Debt

### Supabase Storage Cleanup Policy
- **Trigger:** Before Phase 1 launch
- **Why:** 190 generations x ~7MB = 1.3GB, may exceed free tier (1GB). Either upgrade Supabase plan or add 30-day auto-delete.
- **Impact:** Storage costs, disk space

### Budget Check Fail-Closed Pattern
- **Trigger:** During bot development
- **Why:** If Supabase connection fails during budget check, bot must REFUSE generation (fail closed), not skip budget check (fail open). Critical for cost control.
- **Impact:** Prevents runaway API costs if DB is unreachable
