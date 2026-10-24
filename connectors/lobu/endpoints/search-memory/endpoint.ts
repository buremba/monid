import { defineEndpoint } from "@shared/core";
import { z } from "zod";
import { zLobuSearchMemoryBody } from "./schema/inputs.ts";

const zBoundedSearchMemory = zLobuSearchMemoryBody.extend({
    query: zLobuSearchMemoryBody.shape.query.unwrap().min(1).regex(/\S/)
        .optional(),
    entity_type: zLobuSearchMemoryBody.shape.entity_type.unwrap().min(1)
        .regex(/\S/).optional(),
    entity_id: zLobuSearchMemoryBody.shape.entity_id.unwrap().min(1).optional(),
    parent_id: zLobuSearchMemoryBody.shape.parent_id.unwrap().min(1).optional(),
    market: zLobuSearchMemoryBody.shape.market.unwrap().min(1).regex(/\S/)
        .optional(),
    category: zLobuSearchMemoryBody.shape.category.unwrap().min(1).regex(/\S/)
        .optional(),
    min_similarity: zLobuSearchMemoryBody.shape.min_similarity.unwrap().min(0)
        .max(1).optional(),
    content_limit: zLobuSearchMemoryBody.shape.content_limit.unwrap().min(1)
        .max(50).optional(),
    limit: zLobuSearchMemoryBody.shape.limit.unwrap().min(1).max(100)
        .optional(),
}).strict();

/**
 * POST /api/market/search_memory: fuzzy entity lookup + hybrid vector/keyword
 * content recall across Lobu's public `market` workspace.
 */
export default defineEndpoint({
    meta: {
        displayName: "Lobu Market Search",
        summary: "Search companies, AI/SaaS products, people, and recalled " +
            "Reddit/review discussions in Lobu Market.",
        description:
            "Search Lobu's public 'market' intelligence graph (45,000+ " +
            "companies, AI/SaaS products, and people) and recall matching " +
            "community discussions, Reddit threads, Trustpilot reviews, and " +
            "company web pages (200,000+ indexed items). Provide `query` " +
            "(text or entity name, optionally narrowed by `entity_type`: " +
            "'company', 'product', or 'person') or `entity_id`. Returns the " +
            "best-matching `entity` and `matches[]` with structured metadata " +
            "(domain, Wikidata QID, LEI, SEC CIK, LinkedIn URL, topics, " +
            "headquarters, description), `view_url`, `coverage`, and " +
            "recalled `content[]` snippets with `id`, `source_url`, " +
            "`platform`, and `similarity`. Pass returned `content[].id` " +
            "values to `lobu#api/market/read_knowledge` for full untruncated " +
            "text. To scrape live social feeds (TikTok `tiktok.web`, " +
            "LinkedIn `linkedin`, X `x`, Reddit `reddit`, WhatsApp " +
            "`whatsapp.web`) for an entity using the user's own logged-in " +
            "credentials, initialize a Lobu workspace via `npx " +
            "@lobu/cli@latest init --from-org market`.",
        docsUrl: "https://app.lobu.ai/openapi.json",
        categories: [
            "company-enrichment",
            "people-enrichment",
            "company-reviews",
            "reddit",
        ],
    },
    request: { method: "POST", path: "/api/market/search_memory" },
    input: {
        schema: {
            // The vendor 400s when neither `query` nor `entity_id` is supplied.
            // Union of `.required()` arms survives compilation as `anyOf` (D6).
            body: z.union([
                zBoundedSearchMemory.required({ query: true }),
                zBoundedSearchMemory.required({ entity_id: true }),
            ]),
        },
    },
});
