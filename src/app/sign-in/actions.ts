"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/safe-next";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

const emailSchema = z.email();

export async function sendMagicLink(_prev: SignInState, form: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };
  const next = safeNext(String(form.get("next") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      // Staff are invited by a venue admin; sign-in never creates accounts.
      shouldCreateUser: false,
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  // Don't reveal whether an address has an account.
  if (error && error.status !== 422 && error.code !== "otp_disabled" && error.code !== "user_not_found") {
    return { status: "error", message: "We couldn't send the link just now. Try again in a minute." };
  }
  return { status: "sent", email: parsed.data };
}

export async function signInWithMicrosoft(form: FormData) {
  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      scopes: "email",
      redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) redirect("/sign-in?error=microsoft");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/sign-in");
}
