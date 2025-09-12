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

// Update this function to accept prevState as first parameter
export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName"),
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate inputs
  if (!data.email || !data.password || !data.confirmPassword || !data.firstName || !data.lastName) {
    return { error: "Please fill in all fields" };
  }

  if (data.password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  if (data.password !== data.confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Check if user already exists by attempting to sign in
  const { data: existingUser, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

  // If sign in succeeds, user already exists
  if (existingUser.user && !signInError) {
    // Sign out the user since we don't want them logged in from this check
    await supabase.auth.signOut();
    return {
      error: "An account with this email already exists. Please login instead.",
    };
  }

  // If there's a sign in error but it's not "Invalid login credentials",
  // it might be an existing user with wrong password
  if (
    signInError &&
    !signInError.message.includes("Invalid login credentials")
  ) {
    return {
      error: "An account with this email already exists. Please login instead.",
    };
  }

  // Proceed with signup if user doesn't exist
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data : {
        first_name: data.firstName,
        last_name: data.lastName,
      }
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

export async function signInWithFacebook(_prevState: any, _formData: FormData) {
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
