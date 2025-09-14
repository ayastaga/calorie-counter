"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "./login-form";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Suspense } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "signup-success") {
      toast.success("Sign up successful!", {
        description: "Please check your email to confirm",
      });
    }
  }, [searchParams]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Calorie Counter
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/placeholder.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </Suspense>
  );
}
