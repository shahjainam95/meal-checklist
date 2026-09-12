import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null;

export const redis = url && token ? new Redis({ url, token }) : null;

export const SERVED_KEY = "served:v1";   // hash of collected states
export const ROSTER_KEY = "roster:v1";   // published (cleaned) roster JSON
