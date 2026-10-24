import { z } from "zod";

/**
 * POST /api/market/search_memory body, mirrored from the published OpenAPI
 * (`https://app.lobu.ai/openapi.json`, read 2026-10-24). Optionality only
 * (D25): numeric bounds, non-blank strings, and the "query OR entity_id"
 * requirement live at the binding.
 */
export const zLobuSearchMemoryBody = z.object({
    query: z.string().describe(
        "Search saved memory by text or entity name (e.g. 'Anthropic', " +
            "'Stripe', 'Cursor pricing'). Required unless `entity_id` is " +
            "provided.",
    ).optional(),
    entity_type: z.string().describe(
        "Optional entity type filter, e.g. 'company', 'product', or 'person'. " +
            "When omitted, searches all entity types.",
    ).optional(),
    entity_id: z.number().int().describe(
        "Look up a specific entity by its integer entity ID (as returned in " +
            "`entity.id` or `matches[].id`). Do not pass content/event IDs " +
            "here; use `read_knowledge` with `content_ids` for those.",
    ).optional(),
    parent_id: z.number().int().describe(
        "Optional parent entity ID filter.",
    ).optional(),
    market: z.string().describe(
        "Optional market/region code filter (ISO 3166-1 alpha-2, e.g. 'US', 'GB').",
    ).optional(),
    category: z.string().describe(
        "Optional category metadata filter.",
    ).optional(),
    fuzzy: z.boolean().describe(
        "Enable fuzzy entity-name matching (default: true).",
    ).optional(),
    min_similarity: z.number().describe(
        "Minimum similarity threshold (0.0-1.0, default: 0.3) applied to " +
            "both fuzzy entity matching and recalled content.",
    ).optional(),
    include_connections: z.boolean().describe(
        "Include visible connection details in the response (default: true).",
    ).optional(),
    include_content: z.boolean().describe(
        "Include semantic content search results (Reddit threads, reviews, " +
            "and web pages) alongside entity matches (default: true).",
    ).optional(),
    content_limit: z.number().int().describe(
        "Maximum number of recalled content items when `include_content` is " +
            "enabled (1-50, default: 5).",
    ).optional(),
    limit: z.number().int().describe(
        "Maximum number of entity matches to return (1-100, default: 5).",
    ).optional(),
    include_public_catalogs: z.boolean().describe(
        "Also search public-catalog workspaces for canonical entities " +
            "(default: true).",
    ).optional(),
});
