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
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    NUTRITIONIX_APP_ID: z.string().min(1, "NUTRITIONIX_APP_ID is required"),
    NUTRITIONIX_API_KEY: z.string().min(1, "NUTRITIONIX_API_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    RECAPTCHA_SECRET_KEY: z.string().min(1, "RECAPTCHA_SECRET_KEY is required"),
  },

  /**
   * Client-side environment variables schema.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid Supabase URL"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
    NEXT_PUBLIC_SITE_URL: z.string().url("Must be a valid site URL"),
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_RECAPTCHA_SITE_KEY is required"),
  },

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
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
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
