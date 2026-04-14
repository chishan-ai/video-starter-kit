import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  pgEnum,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Enums ──

export const projectStyleEnum = pgEnum("project_style", [
  "anime",
  "realistic",
  "3d",
  "mixed",
]);

export const aspectRatioEnum = pgEnum("aspect_ratio", ["9:16", "16:9", "1:1"]);

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "generating",
  "completed",
  "exported",
]);

export const shotStatusEnum = pgEnum("shot_status", [
  "pending",
  "generating",
  "completed",
  "failed",
]);

export const cameraTypeEnum = pgEnum("camera_type", [
  "wide",
  "medium",
  "close-up",
  "overhead",
  "low-angle",
]);

export const creditTypeEnum = pgEnum("credit_type", [
  "purchase",
  "subscription",
  "generation",
  "export",
  "bonus",
  "refund",
]);

export const planEnum = pgEnum("user_plan", [
  "free",
  "starter",
  "pro",
  "studio",
]);

export const exportResolutionEnum = pgEnum("export_resolution", [
  "720p",
  "1080p",
]);

// ── Tables ──

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase Auth uid
  email: text("email").notNull(),
  name: text("name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  creditsBalance: integer("credits_balance").notNull().default(100),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  gender: text("gender"),
  description: text("description").notNull().default(""),
  referenceImages: jsonb("reference_images")
    .$type<{ url: string; angle: "front" | "right" | "back" | "left" | "custom"; label?: string }[]>()
    .notNull()
    .default([]),
  characterSheetUrl: text("character_sheet_url"),
  outfitDescription: text("outfit_description"),
  accessories: jsonb("accessories")
    .$type<{ type: string; description: string; imageUrl?: string }[]>()
    .notNull()
    .default([]),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  style: projectStyleEnum("style").notNull().default("anime"),
  aspectRatio: aspectRatioEnum("aspect_ratio").notNull().default("9:16"),
  status: projectStatusEnum("status").notNull().default("draft"),
  script: text("script").notNull().default(""),
  characterIds: jsonb("character_ids").$type<string[]>().notNull().default([]),
  musicPrompt: text("music_prompt"),
  musicUrl: text("music_url"),
  musicRequestId: text("music_request_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shots = pgTable("shots", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  description: text("description").notNull().default(""),
  duration: integer("duration").notNull().default(4), // seconds, 3-10
  cameraType: cameraTypeEnum("camera_type").notNull().default("medium"),
  characterIds: jsonb("character_ids").$type<string[]>().notNull().default([]),
  status: shotStatusEnum("status").notNull().default("pending"),
  selectedVersionId: uuid("selected_version_id"),
  voiceoverText: text("voiceover_text"),
  ttsAudioUrl: text("tts_audio_url"),
  pendingRequestId: text("pending_request_id"),
  pendingModel: text("pending_model"),
  narrativeIntent: text("narrative_intent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shotVersions = pgTable("shot_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  shotId: uuid("shot_id")
    .notNull()
    .references(() => shots.id, { onDelete: "cascade" }),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  prompt: text("prompt").notNull(),
  model: text("model").notNull(), // e.g. "fal-ai/vidu/q3/image-to-video"
  creditsUsed: integer("credits_used").notNull().default(0),
  externalTaskId: text("external_task_id"), // fal.ai request_id for tracking
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const exports = pgTable("exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoUrl: text("video_url"),
  resolution: exportResolutionEnum("resolution").notNull().default("720p"),
  duration: real("duration"), // total seconds
  fileSize: integer("file_size"), // bytes
  status: text("status").notNull().default("pending"), // pending | rendering | completed | failed
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive = credit, negative = debit
  type: creditTypeEnum("type").notNull(),
  description: text("description").notNull().default(""),
  relatedId: text("related_id"), // shot_id, export_id, stripe_payment_id etc.
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
