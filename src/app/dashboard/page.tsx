import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import ImageUploadAnalysisCard from "../components/image-upload-analysis";
import { UtensilsCrossed } from "lucide-react";
import Footer from "../components/footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

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
      <div className="inline text-center mt-5 text-5xl">
        <UtensilsCrossed className="size-10 flex inline flex-1"/>
        <h1>Welcome, <div className="inline text-green-700">{displayName}</div></h1>
      </div>
      <ImageUploadAnalysisCard />
    </Shell>
    <Footer/>
    </>
  );
}
