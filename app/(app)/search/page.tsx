import { SearchBox } from "./search-box";

export default function SearchPage() {
  return (
    <>
      <h1>Search</h1>
      <p className="muted">
        Searches across every project you have access to — you&apos;ll never see results from a project you&apos;re
        not a member of.
      </p>
      <SearchBox />
    </>
  );
}
