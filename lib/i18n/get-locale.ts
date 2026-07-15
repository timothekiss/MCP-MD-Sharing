import type { User } from "@supabase/supabase-js";
import type { Locale } from "./dictionary";

// The user's language choice lives in their own Supabase Auth user_metadata —
// no extra table needed, and it's already available wherever we fetch the user.
export function getLocale(user: User | null | undefined): Locale {
  const locale = user?.user_metadata?.locale;
  return locale === "fr" ? "fr" : "en";
}
