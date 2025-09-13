// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import DOMPurify from "isomorphic-dompurify";
import rateLimit from "@/lib/rate-limit";
import { logAuditEvent, AuditEventType } from "@/lib/audit-logger";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createClient } from "@/utils/supabase/server";

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per minute
});

interface FeedbackData {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  consent: boolean;
  recaptchaToken: string;
}

// Input sanitization and validation
function sanitizeAndValidateInput(data: any): {
  isValid: boolean;
  sanitized?: FeedbackData;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if data exists and is an object
  if (!data || typeof data !== "object") {
    errors.push("Invalid request data");
    return { isValid: false, errors };
  }

  // Sanitize and validate each field
  const sanitized: Partial<FeedbackData> = {};

  // Name validation and sanitization
  if (!data.name || typeof data.name !== "string") {
    errors.push("Name is required and must be a string");
  } else {
    sanitized.name = DOMPurify.sanitize(data.name.trim());
    if (sanitized.name.length === 0 || sanitized.name.length > 100) {
      errors.push("Name must be between 1 and 100 characters");
    }
  }

  // Email validation and sanitization
  if (!data.email || typeof data.email !== "string") {
    errors.push("Email is required and must be a string");
  } else {
    sanitized.email = DOMPurify.sanitize(data.email.trim().toLowerCase());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized.email)) {
      errors.push("Invalid email format");
    }
    if (sanitized.email.length > 255) {
      errors.push("Email must be less than 255 characters");
    }
  }

  // Category validation
  const validCategories = [
    "bug",
    "feature",
    "improvement",
    "general",
    "support",
    "other",
  ];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push("Invalid category");
  } else {
    sanitized.category = data.category;
  }

  // Subject validation and sanitization
  if (!data.subject || typeof data.subject !== "string") {
    errors.push("Subject is required and must be a string");
  } else {
    sanitized.subject = DOMPurify.sanitize(data.subject.trim());
    if (sanitized.subject.length === 0 || sanitized.subject.length > 200) {
      errors.push("Subject must be between 1 and 200 characters");
    }
  }

  // Message validation and sanitization
  if (!data.message || typeof data.message !== "string") {
    errors.push("Message is required and must be a string");
  } else {
    sanitized.message = DOMPurify.sanitize(data.message.trim());
    if (sanitized.message.length === 0 || sanitized.message.length > 2000) {
      errors.push("Message must be between 1 and 2000 characters");
    }
  }

  // Priority validation
  const validPriorities = ["low", "medium", "high", "urgent"];
  if (!data.priority || !validPriorities.includes(data.priority)) {
    sanitized.priority = "medium"; // Default to medium if not provided or invalid
  } else {
    sanitized.priority = data.priority;
  }

  // Consent validation
  if (data.consent !== true) {
    errors.push("Consent is required");
  } else {
    sanitized.consent = true;
  }

  // reCAPTCHA token validation
  if (!data.recaptchaToken || typeof data.recaptchaToken !== "string") {
    errors.push("reCAPTCHA token is required");
  } else {
    sanitized.recaptchaToken = data.recaptchaToken;
  }

  return {
    isValid: errors.length === 0,
    sanitized: errors.length === 0 ? (sanitized as FeedbackData) : undefined,
    errors,
  };
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  return request.ip || "unknown";
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      await logAuditEvent({
        eventType: AuditEventType.FEEDBACK_SUBMISSION_FAILED,
        userId: null,
        ipAddress: clientIP,
        userAgent,
        details: { error: "Invalid JSON in request body" },
        metadata: { processingTime: Date.now() - startTime },
      });

      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Rate limiting
    try {
      await limiter.check(10, clientIP); // 10 requests per minute per IP
    } catch (error) {
      await logAuditEvent({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        userId: null,
        ipAddress: clientIP,
        userAgent,
        details: { rateLimitType: "feedback_submission" },
        metadata: { processingTime: Date.now() - startTime },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Rate limit exceeded. Please try again later.",
          rateLimitInfo: {
            remaining: 0,
            resetTime: Math.floor(Date.now() / 1000) + 60,
          },
        },
        { status: 429 }
      );
    }

    // Input validation and sanitization
    const validation = sanitizeAndValidateInput(body);
    if (!validation.isValid) {
      await logAuditEvent({
        eventType: AuditEventType.FEEDBACK_SUBMISSION_FAILED,
        userId: null,
        ipAddress: clientIP,
        userAgent,
        details: {
          error: "Validation failed",
          validationErrors: validation.errors,
        },
        metadata: { processingTime: Date.now() - startTime },
      });

      return NextResponse.json(
        { success: false, message: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const sanitizedData = validation.sanitized!;

    // Verify reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(
      sanitizedData.recaptchaToken,
      clientIP
    );
    if (!recaptchaValid) {
      await logAuditEvent({
        eventType: AuditEventType.SECURITY_VIOLATION,
        userId: null,
        ipAddress: clientIP,
        userAgent,
        details: {
          violationType: "recaptcha_verification_failed",
          action: "feedback_submission",
        },
        metadata: { processingTime: Date.now() - startTime },
      });

      return NextResponse.json(
        { success: false, message: "reCAPTCHA verification failed" },
        { status: 400 }
      );
    }

    // Save feedback to database
    const supabase = await createClient();
    const { data: feedbackRecord, error: dbError } = await supabase
      .from("feedback")
      .insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        category: sanitizedData.category,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
        priority: sanitizedData.priority,
        ip_address: clientIP,
        user_agent: userAgent,
        status: "open",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);

      await logAuditEvent({
        eventType: AuditEventType.FEEDBACK_SUBMISSION_FAILED,
        userId: null,
        ipAddress: clientIP,
        userAgent,
        details: {
          error: "Database error",
          dbError: dbError.message,
        },
        metadata: { processingTime: Date.now() - startTime },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Failed to save feedback. Please try again.",
        },
        { status: 500 }
      );
    }

    // Log successful submission
    await logAuditEvent({
      eventType: AuditEventType.FEEDBACK_SUBMITTED,
      userId: null,
      ipAddress: clientIP,
      userAgent,
      details: {
        feedbackId: feedbackRecord.id,
        category: sanitizedData.category,
        priority: sanitizedData.priority,
        email: sanitizedData.email,
      },
      metadata: { processingTime: Date.now() - startTime },
    });

    // Send notification email (optional - implement based on your needs)
    // await sendNotificationEmail(sanitizedData, feedbackRecord.id);

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      feedbackId: feedbackRecord.id,
      rateLimitInfo: {
        remaining: 9, // Approximate remaining requests
        resetTime: Math.floor(Date.now() / 1000) + 60,
      },
    });
  } catch (error) {
    console.error("Unexpected error in feedback API:", error);

    await logAuditEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      userId: null,
      ipAddress: clientIP,
      userAgent,
      details: {
        error: "Unexpected server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: { processingTime: Date.now() - startTime },
    });

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
