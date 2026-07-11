import { getServerClient } from "@/lib/supabase-server";
import { CreateApiKeyForm } from "./create-key-form";
import { RevokeApiKeyButton } from "./revoke-key-button";

export default async function ApiKeysPage() {
  const supabase = await getServerClient();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, revoked_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>API keys</h1>
      <p className="muted">Paste one of these into your coding agent&apos;s MCP configuration to connect it.</p>

      {(keys ?? []).map((k) => (
        <div className="list-item" key={k.id}>
          <div>
            <strong>{k.name}</strong>
            <div className="muted">
              {k.key_prefix}… · created {new Date(k.created_at).toLocaleDateString()}
              {k.revoked_at && " · revoked"}
            </div>
          </div>
          {!k.revoked_at && <RevokeApiKeyButton keyId={k.id} />}
        </div>
      ))}

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Create a new key</h3>
        <CreateApiKeyForm />
      </div>
    </>
  );
}
