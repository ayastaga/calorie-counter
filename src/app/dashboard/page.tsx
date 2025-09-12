import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import ImageUploadAnalysisCard from "../components/image-upload-analysis";

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
    <Shell className="max-w-2xl">
      {/* custom animation here perhaps */}
      <h1 className="text-center text-3xl">Welcome, {displayName}!</h1>
      <ImageUploadAnalysisCard />
    </Shell>
  );
}
