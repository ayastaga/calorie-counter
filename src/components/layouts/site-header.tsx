import { Utensils } from "lucide-react";
import Link from "next/link";

import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/layouts/mode-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site"
import { auth0 } from "@/lib/auth0";

const CustomComponent = async () => {
    const session = await auth0.getSession();
    if (!session) {
      return (<Link className="hover:bg-black hover:text-white px-2 py-1 rounded-md" href="/auth/login">Login</Link>);
    } else {
      return (
        <div className="flex justify-end">
          <Link className="hover:bg-black hover:text-white px-2 py-1 rounded-md w-min" href="/dashboard">Dashboard</Link>
          <Link className="hover:bg-black hover:text-white px-2 py-1 rounded-md w-min" href="/profile">Profile</Link>
          <Link className="hover:bg-black hover:text-white px-2 py-1 rounded-md w-min" href="/auth/logout">Logout</Link>
        </div>
    );
    }
}

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
        {/* 
        <nav className="flex flex-1 items-center md:justify-end">
          <ModeToggle />
        </nav>
        */}
        <nav className="flex flex-1 items-center md:justify-end"></nav>
        <CustomComponent/>
      </div>
    </header>
  );
}
