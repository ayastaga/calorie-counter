import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    UPLOADTHING_TOKEN: z.string().min(1, "UPLOADTHING_TOKEN is required"),
    UPSTASH_REDIS_REST_URL: z.string().url("Must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),

    NUTRITIONIX_APP_ID: z.string().min(1, "NUTRITIONIX_APP_ID is required"),
    NUTRITIONIX_API_KEY: z.string().min(1, "NUTRITIONIX_API_KEY is required"),
  },

  /**
   * Client-side environment variables schema (empty for now).
   */
  client: {},

  /**
   * Runtime environment values loaded from process.env.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NUTRITIONIX_APP_ID: process.env.NUTRITIONIX_APP_ID,
    NUTRITIONIX_API_KEY: process.env.NUTRITIONIX_API_KEY,
  },

  /**
   * Allow skipping validation (useful for Docker or CI).
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined (enforces required fields).
   */
  emptyStringAsUndefined: true,
});
