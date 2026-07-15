import { getServerClient } from "@/lib/supabase-server";
import { SearchBox } from "./search-box";

export default async function SearchPage() {
  const supabase = await getServerClient();
  const { data: projects } = await supabase.from("projects").select("id, name").order("name");

  return (
    <>
      <h1>Search</h1>
      <p className="muted">
        Searches across every project you have access to — you&apos;ll never see results from a project you&apos;re
        not a member of.
      </p>
      <SearchBox projects={projects ?? []} />
    </>
  );
}
