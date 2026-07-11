import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// A Supabase client bound to the visitor's own session cookie — every query
// it makes goes through RLS as that specific user, never with elevated access.
export async function getServerClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component with no response to attach cookies to;
          // the middleware below refreshes the session on every request instead.
        }
      },
    },
  });
}
