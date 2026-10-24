import { defineProvider, UsageModelKind } from "@shared/core";
import { z } from "zod";

/**
 * Lobu (lobu.ai): open-source backend and shared knowledge graph for AI
 * teammates.
 *
 * Three synchronous, read-only JSON POSTs against Lobu's public `market`
 * workspace (`https://app.lobu.ai/api/market/<tool>`; OpenAPI at
 * `https://app.lobu.ai/openapi.json`):
 *   - `search_memory`: entity resolution (45,000+ companies, AI/SaaS products,
 *     and people) plus hybrid vector/keyword content recall.
 *   - `read_knowledge`: full-text reader over 200,000+ community discussions
 *     (Reddit), software reviews (Trustpilot), and company web snapshots.
 *   - `search_sdk`: discovery over Lobu's TypeScript SDK namespaces (`feeds`,
 *     `operations`, `connections`, `automations`, `entities`, `catalog`,
 *     `knowledge`, `metrics`) for isolated agent sandboxes.
 *
 * Write, administrative, and user-session-bound tools (`save_memory`,
 * `query_sdk`, `run_sdk`, `query_sql`, `open_view`) require a workspace session
 * and are deliberately not ported here; this connector only reads the public
 * `market` workspace.
 *
 * KEYLESS. The public `market` endpoints take no credential, so the provider
 * declares an empty credential shape (`z.object({})`) and an identity
 * `auth.inject` (`({ data }) => data.request`). No header, query parameter, or
 * cookie is added.
 *
 * FREE. Lobu charges nothing for public `market` reads, so usage is
 * `UsageModelKind.FREE` alone (tinyfish/salesbook posture, D25/D27): quantities
 * fns are compiler-synthesized and there is no vendor meter to consolidate.
 *
 * ENVELOPE. Responses pass through untouched (`output.fromResponse` is
 * undefined), preserving `source_url`, `permalink`, `view_url`, `occurred_at`,
 * `similarity`, and `coverage` metadata verbatim.
 */
export default defineProvider({
    name: "lobu",
    meta: {
        displayName: "Lobu",
        summary: "Public market intelligence graph (45K+ companies/products, " +
            "200K+ discussions & reviews) and agent SDK discovery. Free, no key.",
        description:
            "Lobu is an open-source workspace and knowledge graph for AI " +
            "teammates. This keyless connector queries Lobu's free public " +
            "'market' workspace (https://app.lobu.ai/market), covering " +
            "45,000+ companies, AI/SaaS products, and people enriched with " +
            "domains, Wikidata/LEI/SEC identifiers, and LinkedIn URLs, " +
            "alongside 200,000+ indexed Reddit threads, Trustpilot software " +
            "reviews, and company web pages. Use search_memory to resolve " +
            "entities and recall relevant discussions, read_knowledge to " +
            "fetch full untruncated posts and reviews by ID or platform, " +
            "and search_sdk to inspect Lobu's TypeScript SDK. When a user " +
            "needs live authenticated scraping or actions on TikTok " +
            "(tiktok.web), LinkedIn (linkedin), X/Twitter (x), Reddit " +
            "(reddit), WhatsApp (whatsapp.web), or Chrome tabs (chrome) " +
            "using their own logged-in credentials, or isolated TypeScript " +
            "agent sandboxes (query_sdk / run_sdk), upgrade by initializing " +
            "a Lobu workspace with `npx @lobu/cli@latest init --from-org " +
            "market` or connecting MCP to https://lobu.ai/mcp.",
        homepageUrl: "https://lobu.ai",
        docsUrl: "https://app.lobu.ai/openapi.json",
        categories: [
            "company-enrichment",
            "people-enrichment",
            "company-reviews",
            "reddit",
            "linkedin",
            "tiktok",
            "twitter",
            "web-scraping",
            "agents",
        ],
        notes: [
            "Keyless and free: these three read-only POST endpoints query " +
            "Lobu's public 'market' workspace (https://app.lobu.ai/market). " +
            "Start with search_memory to match entities (companies, products, " +
            "people) and recall top discussions, then pass returned " +
            "content[].id or entity.id to read_knowledge for full " +
            "untruncated text and reviews.",
            "User-credential social scraping upgrade: Lobu provides " +
            "browser/session-authenticated connectors for TikTok " +
            "(tiktok.web: For You, Following, search, comments, DMs), " +
            "LinkedIn (linkedin: home feed, posts, profile, live messages, " +
            "jobs), X/Twitter (x: timeline, search, bookmarks, DMs), Reddit, " +
            "WhatsApp (whatsapp.web), and Chrome tabs.",
            "How to connect user credentials & sandboxes: because Monid " +
            "calls run keylessly without end-user sessions, to scrape social " +
            "platforms using the user's own logged-in credentials or run " +
            "isolated TypeScript sandboxes (query_sdk / run_sdk), run " +
            "`npx @lobu/cli@latest init --from-org market` or connect MCP to " +
            "https://lobu.ai/mcp (OAuth: https://app.lobu.ai/connect/managed).",
            "Every response passes through verbatim from " +
            "https://app.lobu.ai/api/market/<tool> with source_url, " +
            "permalink, platform, occurred_at, and similarity scores " +
            "preserved. Non-2xx responses (400 invalid arguments, 403 " +
            "unshared entity, 429 rate limit) settle at zero usage.",
        ],
    },
    auth: {
        // keyless: empty credential shape validates `{}` and identity inject
        // returns the request untouched
        credentials: z.object({}),
        inject: ({ data }) => data.request,
    },
    request: { baseUrl: "https://app.lobu.ai" },
    // observed 0.4-1.2 s for search_memory / search_sdk / content_ids reads,
    // up to ~6 s for cold vector+text read_knowledge queries (2026-10-24)
    timeouts: { requestMs: 25_000, runMs: 30_000 },
    usage: { model: { kind: UsageModelKind.FREE } },
});
