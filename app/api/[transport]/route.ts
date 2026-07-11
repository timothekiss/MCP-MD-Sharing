import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { verifyApiKey } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/permissions";
import {
  createDocument,
  getHistory,
  getVersion,
  listDocuments,
  listProjectsForUser,
  readDocument,
  restoreVersion,
  updateDocument,
  VersionConflictError,
} from "@/lib/documents";
import { search } from "@/lib/search";

function conflictResult(err: VersionConflictError) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            error: "VERSION_CONFLICT",
            current_version: err.currentVersion,
            current_content: err.currentContent,
            hint: "Merge your changes into current_content, then retry with expected_version=current_version.",
          },
          null,
          2
        ),
      },
    ],
  };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_projects",
      "List the projects the current user can access",
      {},
      async (_args, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        const projects = await listProjectsForUser(userId);
        return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
      }
    );

    server.tool(
      "list_documents",
      "List the MD documents in a project",
      { project_id: z.string().uuid() },
      async ({ project_id }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "reader");
        const docs = await listDocuments(project_id);
        return { content: [{ type: "text", text: JSON.stringify(docs, null, 2) }] };
      }
    );

    server.tool(
      "read_document",
      "Read the current version of an MD document",
      { project_id: z.string().uuid(), path: z.string() },
      async ({ project_id, path }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "reader");
        const doc = await readDocument(project_id, path);
        return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
      }
    );

    server.tool(
      "create_document",
      "Create a new MD document in a project",
      {
        project_id: z.string().uuid(),
        path: z.string(),
        content: z.string(),
        message: z.string().optional(),
      },
      async ({ project_id, path, content, message }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "editor");
        const result = await createDocument(project_id, path, content, userId, message);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      "update_document",
      "Save a new version of an existing MD document. Requires expected_version " +
        "(the version you last read) to prevent overwriting someone else's concurrent edit. " +
        "If the document has moved on, this returns a VERSION_CONFLICT with the latest content to merge.",
      {
        project_id: z.string().uuid(),
        path: z.string(),
        content: z.string(),
        expected_version: z.number().int().positive(),
        message: z.string().optional(),
      },
      async ({ project_id, path, content, expected_version, message }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "editor");
        try {
          const result = await updateDocument(project_id, path, content, userId, expected_version, message);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          if (err instanceof VersionConflictError) return conflictResult(err);
          throw err;
        }
      }
    );

    server.tool(
      "get_history",
      "List the version history of an MD document (metadata only, not full content)",
      { project_id: z.string().uuid(), path: z.string(), limit: z.number().int().positive().max(100).optional() },
      async ({ project_id, path, limit }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "reader");
        const history = await getHistory(project_id, path, limit);
        return { content: [{ type: "text", text: JSON.stringify(history, null, 2) }] };
      }
    );

    server.tool(
      "get_version",
      "Read the full content of a specific historical version of an MD document",
      { project_id: z.string().uuid(), path: z.string(), version_number: z.number().int().positive() },
      async ({ project_id, path, version_number }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "reader");
        const version = await getVersion(project_id, path, version_number);
        return { content: [{ type: "text", text: JSON.stringify(version, null, 2) }] };
      }
    );

    server.tool(
      "restore_version",
      "Restore an old version as the new current version (creates a fresh version with the old content). " +
        "Requires expected_version to protect against concurrent edits, same as update_document.",
      {
        project_id: z.string().uuid(),
        path: z.string(),
        version_number: z.number().int().positive(),
        expected_version: z.number().int().positive(),
      },
      async ({ project_id, path, version_number, expected_version }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        await requireProjectAccess(userId, project_id, "editor");
        try {
          const result = await restoreVersion(project_id, path, version_number, userId, expected_version);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          if (err instanceof VersionConflictError) return conflictResult(err);
          throw err;
        }
      }
    );

    server.tool(
      "search",
      "Search across MD documents using hybrid semantic + keyword search. " +
        "If project_id is omitted, searches every project the user can access.",
      {
        query: z.string(),
        project_id: z.string().uuid().optional(),
        limit: z.number().int().positive().max(50).optional(),
      },
      async ({ query, project_id, limit }, extra) => {
        const userId = extra.authInfo!.extra!.userId as string;
        const results = await search(userId, query, project_id, limit);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );
  },
  {},
  { basePath: "/api" }
);

const authHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    const authHeader = bearerToken ? `Bearer ${bearerToken}` : null;
    const user = await verifyApiKey(authHeader);
    if (!user) return undefined;

    return {
      token: bearerToken!,
      clientId: user.userId,
      scopes: ["mcp"],
      extra: { userId: user.userId, apiKeyId: user.apiKeyId },
    };
  },
  { required: true }
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
