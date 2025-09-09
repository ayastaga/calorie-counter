"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(_prevState: any, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  if (!data.email || !data.password) {
    return { error: "Please provide both email and password" };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login error:", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate inputs
  if (!data.email || !data.password || !data.confirmPassword) {
    return { error: "Please fill in all fields" };
  }

  if (data.password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  if (data.password !== data.confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error);
    return { error: error.message };
  }

  return { success: "Please check your email to confirm your account" };
}

export async function signInWithGoogle(_prevState: any, _formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google login error:", error);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithFacebook() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Facebook login error:", error);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}
