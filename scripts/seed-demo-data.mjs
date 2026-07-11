import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function createUser(email) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "DemoPassword123!",
    email_confirm: true,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.user.id;
}

async function createOrg(name) {
  const { data, error } = await supabase.from("organizations").insert({ name }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function addMembership(orgId, userId, role) {
  const { error } = await supabase.from("memberships").insert({ organization_id: orgId, user_id: userId, role });
  if (error) throw new Error(error.message);
}

async function createProject(orgId, name) {
  const { data, error } = await supabase.from("projects").insert({ organization_id: orgId, name }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function addProjectMember(projectId, userId, role) {
  const { error } = await supabase.from("project_members").insert({ project_id: projectId, user_id: userId, role });
  if (error) throw new Error(error.message);
}

async function createDocument(projectId, path, content, authorId) {
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ project_id: projectId, path, current_version: 1 })
    .select("id")
    .single();
  if (docError) throw new Error(docError.message);

  const { error: versionError } = await supabase.from("versions").insert({
    document_id: doc.id,
    version_number: 1,
    content,
    message: "Initial version",
    author_id: authorId,
  });
  if (versionError) throw new Error(versionError.message);
  return doc.id;
}

console.log("Creating users...");
const alice = await createUser("alice@example.com");
const bob = await createUser("bob@example.com");
const carol = await createUser("carol@example.com");
const dave = await createUser("dave@example.com");
const erin = await createUser("erin@example.com");

console.log("Creating organizations...");
const acme = await createOrg("Acme Corp");
const globex = await createOrg("Globex Inc");

await addMembership(acme, alice, "owner");
await addMembership(acme, bob, "admin");
await addMembership(acme, carol, "member");

await addMembership(globex, dave, "owner");
await addMembership(globex, erin, "admin");
await addMembership(globex, alice, "member"); // alice also belongs to Globex, as a plain member

console.log("Creating projects...");
const productDocs = await createProject(acme, "Product Docs");
await addProjectMember(productDocs, alice, "admin");
await addProjectMember(productDocs, bob, "editor");
await addProjectMember(productDocs, carol, "reader");

const internalWiki = await createProject(acme, "Internal Wiki");
await addProjectMember(internalWiki, bob, "admin");
await addProjectMember(internalWiki, carol, "editor");

const engHandbook = await createProject(globex, "Engineering Handbook");
await addProjectMember(engHandbook, dave, "admin");
await addProjectMember(engHandbook, erin, "editor");
await addProjectMember(engHandbook, alice, "reader"); // cross-org read access

console.log("Creating documents...");

await createDocument(
  productDocs,
  "README.md",
  `## Overview

Product Docs is the source of truth for how our product works, aimed at both internal teams and integration partners.

## Contents

See the guides and api folders for detailed references.
`,
  alice
);

await createDocument(
  productDocs,
  "guides/getting-started.md",
  `## Getting started

1. Create an account.
2. Generate an API key from Settings.
3. Call the API using the key as a Bearer token.

## Support

Reach out in the #product-docs channel for questions.
`,
  bob
);

await createDocument(
  productDocs,
  "api/authentication.md",
  `## Authentication

All requests must include an \`Authorization: Bearer <token>\` header.

## Rotating keys

Revoke a compromised key immediately from the dashboard; it takes effect within seconds.
`,
  bob
);

await createDocument(
  internalWiki,
  "onboarding.md",
  `## Onboarding checklist

- Get access to Slack and email
- Meet your onboarding buddy
- Read the engineering handbook

## First week

Shadow a teammate on at least two customer calls.
`,
  bob
);

await createDocument(
  internalWiki,
  "policies/vacation.md",
  `## Vacation policy

Employees get 25 days of paid vacation per year, accrued monthly.

## Requesting time off

Submit requests at least two weeks in advance through the HR portal.
`,
  carol
);

await createDocument(
  engHandbook,
  "architecture/overview.md",
  `## Architecture overview

Our backend is a set of services communicating over gRPC, backed by Postgres and Redis.

## Deployment

Everything ships as containers orchestrated by our internal platform.
`,
  dave
);

await createDocument(
  engHandbook,
  "runbooks/deploy.md",
  `## Deploy runbook

1. Merge to main after review.
2. CI builds and runs the test suite.
3. Deployment rolls out gradually with automatic rollback on error spikes.

## Rollback

Use the "rollback" button in the deploy dashboard to revert to the previous version instantly.
`,
  erin
);

console.log("Done. Summary:");
console.log(
  JSON.stringify(
    {
      organizations: { acme, globex },
      users: { alice, bob, carol, dave, erin },
      projects: { productDocs, internalWiki, engHandbook },
    },
    null,
    2
  )
);
