// lib/audit-logger.ts
import { createClient } from "@supabase/supabase-js";

// Create a dedicated Supabase client for audit logging with service role
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export enum AuditEventType {
  FEEDBACK_SUBMITTED = "feedback_submitted",
  FEEDBACK_SUBMISSION_FAILED = "feedback_submission_failed",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  SECURITY_VIOLATION = "security_violation",
  SYSTEM_ERROR = "system_error",
  USER_LOGIN = "user_login",
  USER_LOGOUT = "user_logout",
  DATA_ACCESS = "data_access",
  CONFIGURATION_CHANGE = "configuration_change",
}

export interface AuditEvent {
  eventType: AuditEventType;
  userId?: string | null;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const auditRecord = {
      event_type: event.eventType,
      user_id: event.userId || null,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      details: event.details,
      metadata: event.metadata || {},
      created_at: event.timestamp || new Date().toISOString(),
    };

    const { error } = await supabaseServiceRole
      .from("audit_logs")
      .insert(auditRecord);

    if (error) {
      console.error("Failed to log audit event:", error);
      console.error("Audit event details:", auditRecord);
      // Don't throw error - audit logging shouldn't break the main flow
    }
  } catch (error) {
    console.error("Error in audit logging:", error);
    // Log the failed event for debugging
    console.log("Failed audit event:", event);
  }
}

// Create a simplified version for client-side logging (optional)
export async function logClientEvent(
  eventType: AuditEventType,
  details: Record<string, any>
): Promise<void> {
  try {
    await fetch("/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType,
        details,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to log client event:", error);
  }
}

// Helper function to safely extract IP address from NextRequest
export function getClientIP(
  request: Request | { headers: { get: (key: string) => string | null } }
): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;

  return "unknown";
}

// Helper function to safely extract user agent
export function getClientUserAgent(
  request: Request | { headers: { get: (key: string) => string | null } }
): string {
  return request.headers.get("user-agent") || "unknown";
}
