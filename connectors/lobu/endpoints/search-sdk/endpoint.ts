import { defineEndpoint } from "@shared/core";
import { zLobuSearchSdkBody } from "./schema/inputs.ts";

/**
 * POST /api/market/search_sdk: discover Lobu TypeScript SDK methods, sandbox
 * helpers, and connector workflows.
 */
export default defineEndpoint({
    meta: {
        displayName: "Lobu SDK & Connector Discovery",
        summary: "Discover Lobu TypeScript SDK methods, sandbox helpers, and " +
            "connector workflows.",
        description:
            "Search Lobu's TypeScript SDK documentation and runtime helpers " +
            "by namespace (`agents`, `authProfiles`, `automations`, " +
            "`catalog`, `classifiers`, `connections`, `conversations`, " +
            "`ctx`, `devices`, `entities`, `entitySchema`, `feeds`, " +
            "`knowledge`, `metrics`, `notifications`, `operations`, " +
            "`organizations`, `schedules`, `views`), method name (e.g. " +
            "`feeds.readMany`, `operations.listAvailable`, " +
            "`connections.setupOptions`), or keyword. Pass `mode: 'read'` to " +
            "restrict to read-only `query_sdk` methods. In an authenticated " +
            "Lobu workspace (`npx @lobu/cli@latest init --from-org market` " +
            "or MCP at `https://lobu.ai/mcp`), agents execute these SDK " +
            "methods inside isolated V8 TypeScript sandboxes and can drive " +
            "user-authenticated social connectors for TikTok (`tiktok.web`), " +
            "LinkedIn (`linkedin`), X/Twitter (`x`), Reddit (`reddit`), " +
            "WhatsApp (`whatsapp.web`), and Chrome (`chrome`) using the " +
            "user's own logged-in browser session or managed OAuth.",
        docsUrl: "https://app.lobu.ai/openapi.json",
        categories: [
            "agents",
            "web-scraping",
            "linkedin",
            "tiktok",
            "twitter",
            "reddit",
        ],
    },
    request: { method: "POST", path: "/api/market/search_sdk" },
    input: {
        schema: {
            body: zLobuSearchSdkBody.extend({
                query: zLobuSearchSdkBody.shape.query.min(1).regex(/\S/),
                limit: zLobuSearchSdkBody.shape.limit.unwrap().min(1).max(100)
                    .optional(),
            }).strict(),
        },
    },
});
