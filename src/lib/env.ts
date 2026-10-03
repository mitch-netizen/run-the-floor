// Public config is inlined at build time; the secret key is server-only.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
// Microsoft sign-in shows only once the Azure provider is configured in Supabase.
export const microsoftSignInEnabled = process.env.NEXT_PUBLIC_AUTH_MICROSOFT_ENABLED === "true";

export function assertSupabaseConfigured() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set");
  }
}
