import { Redis } from "@upstash/redis";

// The Vercel Marketplace Upstash integration injects env vars automatically.
// Depending on how you connect it, they may be UPSTASH_* or KV_* prefixed —
// we accept either so it "just works" after you click Connect.
const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null;

export const redis = url && token ? new Redis({ url, token }) : null;

// Bump this key to wipe all "collected" state (e.g. to reuse for a new event).
export const SERVED_KEY = "served:v1";
