import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import ImageUploadAnalysisCard from "../components/image-upload-analysis";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const bottomLinks = [
    { text: "Terms and Conditions", url: "/terms-and-conditions" },
    { text: "Privacy Policy", url: "/privacy-policy" },
  ]

  // Get user display name (could be from user metadata or email)
  const displayName = 
    user.user_metadata?.first_name ||
    user.user_metadata?.last_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <>
    <Shell className="max-w-2xl mb-6">
      {/* custom animation here perhaps */}
      <div className="inline text-center mt-8 text-5xl">
        <UtensilsCrossed className="size-10 flex inline flex-1"/>
        <h1>Welcome, <div className="inline text-green-700">{displayName}</div></h1>
      </div>
      <ImageUploadAnalysisCard />
    </Shell>
    <footer className="absolute bottom-0  w-full pb-4 justify-center justify-items-center">
      <div className="text-muted-foreground flex flex-col justify-between gap-4 text-sm font-medium md:flex-row md:items-center">
        <ul className="flex gap-4">
          <li><a href="/feedback" className="underline hover:text-blue-700">Send us feedback</a></li>
          {bottomLinks.map((link, linkIdx) => (
            <li key={linkIdx} className="hover:text-primary underline">
              <a href={link.url}>{link.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
    </>
  );
}
