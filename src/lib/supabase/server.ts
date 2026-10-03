import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/** Per-request client acting as the signed-in user (RLS applies). */
export async function createClient() {
  // Read cookies first so pages using this are always rendered per request.
  const cookieStore = await cookies();
  assertSupabaseConfigured();
  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
