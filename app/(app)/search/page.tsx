import { getServerClient } from "@/lib/supabase-server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/dictionary";
import { SearchBox } from "./search-box";

export default async function SearchPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale(user);
  const { data: projects } = await supabase.from("projects").select("id, name").order("name");

  return (
    <>
      <h1>{t(locale, "search.title")}</h1>
      <p className="muted">{t(locale, "search.hint")}</p>
      <SearchBox projects={projects ?? []} />
    </>
  );
}
