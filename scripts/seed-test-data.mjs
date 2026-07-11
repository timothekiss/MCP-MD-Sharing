import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: userData, error: userError } = await supabase.auth.admin.createUser({
  email: "test-local@mcp-md-sharing.dev",
  password: randomBytes(16).toString("hex"),
  email_confirm: true,
});
if (userError) throw userError;
const userId = userData.user.id;

const { data: org, error: orgError } = await supabase
  .from("organizations")
  .insert({ name: "Test Org" })
  .select("id")
  .single();
if (orgError) throw orgError;

await supabase.from("memberships").insert({ organization_id: org.id, user_id: userId, role: "owner" });

const { data: project, error: projectError } = await supabase
  .from("projects")
  .insert({ organization_id: org.id, name: "Test Project" })
  .select("id")
  .single();
if (projectError) throw projectError;

await supabase.from("project_members").insert({ project_id: project.id, user_id: userId, role: "admin" });

const rawKey = "mcpmd_" + randomBytes(24).toString("hex");
const keyHash = createHash("sha256").update(rawKey).digest("hex");

await supabase.from("api_keys").insert({
  user_id: userId,
  name: "local test key",
  key_prefix: rawKey.slice(0, 12),
  key_hash: keyHash,
});

console.log(JSON.stringify({ userId, orgId: org.id, projectId: project.id, apiKey: rawKey }, null, 2));
