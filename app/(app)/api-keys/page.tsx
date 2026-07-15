import { getServerClient } from "@/lib/supabase-server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/dictionary";
import { CreateApiKeyForm } from "./create-key-form";
import { RevokeApiKeyButton } from "./revoke-key-button";

export default async function ApiKeysPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale(user);

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, revoked_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>{t(locale, "apiKeys.title")}</h1>
      <p className="muted">{t(locale, "apiKeys.hint")}</p>

      {(keys ?? []).map((k) => (
        <div className="list-item" key={k.id}>
          <div>
            <strong>{k.name}</strong>
            <div className="muted">
              {k.key_prefix}… · {t(locale, "apiKeys.created")} {new Date(k.created_at).toLocaleDateString()}
              {k.revoked_at && ` · ${t(locale, "apiKeys.revoked")}`}
            </div>
          </div>
          {!k.revoked_at && <RevokeApiKeyButton keyId={k.id} />}
        </div>
      ))}

      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t(locale, "apiKeys.createNew")}</h3>
        <CreateApiKeyForm />
      </div>
    </>
  );
}
