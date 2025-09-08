import { auth0 } from "@/lib/auth0";
import {redirect} from 'next/navigation'
import { Shell } from "@/components/shell";
import ImageUploadAnalysisCard from "../components/image-upload-analysis";
import Link from 'next/link';

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/auth/login')
  }

  return (
      <Shell className="max-w-2xl">
        <h1>Welcome, {session.user.name}</h1>
        <ImageUploadAnalysisCard/>
      </Shell>
  );
}