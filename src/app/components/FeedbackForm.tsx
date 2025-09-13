"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

// Type definition for ReCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | Element, parameters: any) => number;
      execute: (siteKey?: string) => Promise<string>;
      reset: (widgetId?: number) => void;
      ready: (callback: () => void) => void;
    };
  }
}

interface ReCAPTCHAProps {
  sitekey: string;
  size?: "compact" | "normal" | "invisible";
  theme?: "light" | "dark";
  onVerify?: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
}

// Simple ReCAPTCHA component to replace react-google-recaptcha
const ReCAPTCHA = ({
  sitekey,
  size = "invisible",
  onVerify,
  onExpired,
  onError,
}: ReCAPTCHAProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  const executeAsync = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error("ReCAPTCHA not loaded"));
        return;
      }

      if (size === "invisible") {
        window.grecaptcha.execute().then(resolve).catch(reject);
      } else {
        reject(
          new Error(
            "Only invisible reCAPTCHA is supported in this implementation"
          )
        );
      }
    });
  }, [size]);

  const reset = useCallback(() => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  }, []);

  // Expose methods via ref
  const componentRef = useRef({ executeAsync, reset });

  return (
    <div
      ref={containerRef}
      style={{ display: size === "invisible" ? "none" : "block" }}
    />
  );
};

interface FeedbackFormData {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  consent: boolean;
}

interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement" },
  { value: "general", label: "General Feedback" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function FeedbackForm() {
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
    priority: "medium",
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: number;
  } | null>(null);

  const recaptchaRef = useRef<{
    executeAsync: () => Promise<string>;
    reset: () => void;
  } | null>(null);

  const handleInputChange = useCallback(
    (field: keyof FeedbackFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError(""); // Clear error when user starts typing
    },
    []
  );

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.category) return "Category is required";
    if (!formData.subject.trim()) return "Subject is required";
    if (!formData.message.trim()) return "Message is required";
    if (formData.message.length > 2000)
      return "Message must be less than 2000 characters";
    if (!formData.consent) return "You must agree to our privacy policy";

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Please enter a valid email address";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // For now, we'll skip reCAPTCHA if not available
    let recaptchaToken = "";
    try {
      if (recaptchaRef.current) {
        recaptchaToken = await recaptchaRef.current.executeAsync();
      } else {
        // Generate a dummy token for development
        recaptchaToken = "development-token";
      }
    } catch (err) {
      console.warn("ReCAPTCHA not available, proceeding without token");
      recaptchaToken = "no-recaptcha-token";
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      const data: FeedbackResponse = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit exceeded. ${data.message}`);
          setRateLimitInfo(data.rateLimitInfo || null);
        } else {
          setError(data.message || "Failed to submit feedback");
        }
        return;
      }

      // Success
      setSubmitted(true);
      setRateLimitInfo(data.rateLimitInfo || null);

      // Reset form
      setFormData({
        name: "",
        email: "",
        category: "",
        subject: "",
        message: "",
        priority: "medium",
        consent: false,
      });

      // Reset reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (err) {
      console.error("Feedback submission error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setError("");
    setRateLimitInfo(null);
  };

  const backToDashboard = () => {
    redirect("/dashbaord");
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold text-green-700">
              Feedback Submitted Successfully!
            </h3>
            <p className="text-gray-600">
              Thank you for your feedback. We'll review it and get back to you
              if needed.
            </p>
            {rateLimitInfo && (
              <p className="text-sm text-gray-500">
                You have {rateLimitInfo.remaining} submissions remaining.
              </p>
            )}
            <Button onClick={resetForm} variant="outline">
              Submit Another Feedback
            </Button>
            <Button onClick={backToDashboard} variant="outline">
              Return to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Us Your Feedback</CardTitle>
        <CardDescription>
          We value your input! Help us improve by sharing your thoughts,
          reporting bugs, or suggesting new features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {rateLimitInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rate limit: {rateLimitInfo.remaining} submissions remaining.
                Resets at{" "}
                {new Date(rateLimitInfo.resetTime * 1000).toLocaleTimeString()}.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                maxLength={255}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              maxLength={2000}
              rows={6}
              className="resize-none"
              required
            />
            <div className="text-right text-sm text-gray-500">
              {formData.message.length}/2000 characters
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent"
              checked={formData.consent}
              onCheckedChange={(checked) =>
                handleInputChange("consent", checked as boolean)
              }
            />
            <Label htmlFor="consent" className="text-sm">
              I agree that my feedback may be stored and used to improve the
              service, and I have read the privacy statement
            </Label>
          </div>

          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                size="invisible"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
