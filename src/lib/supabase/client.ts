import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Safe to call anywhere
 * on the client — uses the publishable (anon-equivalent) key only,
 * which is meaningless without the RLS policies defined in
 * supabase/migrations honoring it.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
