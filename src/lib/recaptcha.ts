// lib/recaptcha.ts
interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  score?: number;
  action?: string;
}

export async function verifyRecaptcha(
  token: string,
  ip: string
): Promise<boolean> {
  // Skip verification in development or if secret is not set
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn("RECAPTCHA_SECRET_KEY not set, skipping verification");
    return true; // Allow in development
  }

  // Handle development tokens
  if (token === "development-token" || token === "no-recaptcha-token") {
    if (process.env.NODE_ENV === "development") {
      return true;
    } else {
      return false; // Reject in production
    }
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
          remoteip: ip,
        }).toString(),
      }
    );

    if (!response.ok) {
      console.error(
        "ReCAPTCHA API request failed:",
        response.status,
        response.statusText
      );
      return false;
    }

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      console.warn("ReCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    // For reCAPTCHA v3, you might want to check the score
    if (data.score !== undefined) {
      // Score is between 0.0 and 1.0, where 1.0 is very likely a human
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
      if (data.score < minScore) {
        console.warn(`ReCAPTCHA score too low: ${data.score} < ${minScore}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return false;
  }
}
