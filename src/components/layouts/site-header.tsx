import { Utensils } from "lucide-react";
import Link from "next/link";

import { ModeToggle } from "@/components/layouts/mode-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/server";

const AuthenticatedNav = () => {
  return (
    <div className="flex items-center gap-2">
      <Link
        className="hover:bg-black hover:text-white px-2 py-1 rounded-md transition-colors"
        href="/dashboard"
      >
        Dashboard
      </Link>
      <Link
        className="hover:bg-black hover:text-white px-2 py-1 rounded-md transition-colors"
        href="/profile"
      >
        Profile
      </Link>
      <form action="/auth/logout" method="post">
        <Button
          type="submit"
          variant="ghost"
          className="hover:bg-black hover:text-white px-2 py-1 rounded-md transition-colors"
        >
          Logout
        </Button>
      </form>
    </div>
  );
};

const UnauthenticatedNav = () => {
  return (
    <div className="flex items-center gap-2">
      <Link
        className="hover:bg-black hover:text-white px-2 py-1 rounded-md transition-colors"
        href="/about"
      >
        About us
      </Link>
      <Link
        className="hover:bg-black hover:text-white px-2 py-1 rounded-md transition-colors"
        href="/pricing"
      >
        Pricing
      </Link>
      <Link
        className="hover:bg-black hover:text-white px-2 py-1 rounded-md transition-colors"
        href="/login"
      >
        Login
      </Link>
    </div>
  );
};

const CustomComponent = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return <UnauthenticatedNav />;
  }

  return <AuthenticatedNav />;
};

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center gap-6">
        <Link href="/" className="hover:text-green-700 flex items-center gap-2">
          {/* calorie counter logo */}
          <Utensils className="size-4" aria-hidden="true" />
          <span className="hidden font-bold md:inline-block">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="flex flex-1 items-center md:justify-end">
          <ModeToggle />
        </nav>
        <CustomComponent />
      </div>
    </header>
  );
}
