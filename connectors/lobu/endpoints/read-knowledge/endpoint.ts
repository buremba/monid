import { defineEndpoint } from "@shared/core";
import { z } from "zod";
import { zLobuReadKnowledgeBody } from "./schema/inputs.ts";

/**
 * POST /api/market/read_knowledge: read full untruncated community discussions,
 * software reviews, and company web pages from Lobu's public `market`
 * workspace.
 */
export default defineEndpoint({
    meta: {
        displayName: "Lobu Read Knowledge & Reviews",
        summary:
            "Read full Reddit discussions, Trustpilot software reviews, and " +
            "company web pages from Lobu Market.",
        description:
            "Query or fetch full, untruncated knowledge events (`payload_text` " +
            "/ `text_content`) from Lobu's public 'market' workspace " +
            "(200,000+ indexed items across Reddit discussions, Trustpilot " +
            "software reviews, and crawled company pages). Filter by " +
            "`content_ids` (from `search_memory` `content[].id`), `query` " +
            "(hybrid vector + keyword search), `entity_id`, `platforms` " +
            "(`['reddit']`, `['trustpilot']`, `['website']`), or " +
            "`semantic_type` (`'content'`, `'review'`). Each item carries " +
            "its full text, `source_url`, `permalink`, `author_name`, " +
            "`rating`, `score`, `metadata`, and `occurred_at`. In an " +
            "authenticated Lobu workspace (`npx @lobu/cli@latest init " +
            "--from-org market`), live feeds scraped via the user's own " +
            "logged-in credentials on TikTok (`tiktok.web`), LinkedIn " +
            "(`linkedin`), X (`x`), Reddit (`reddit`), and WhatsApp " +
            "(`whatsapp.web`) are normalized into this same knowledge store.",
        docsUrl: "https://app.lobu.ai/openapi.json",
        categories: [
            "company-reviews",
            "reddit",
            "company-enrichment",
            "web-scraping",
        ],
    },
    request: { method: "POST", path: "/api/market/read_knowledge" },
    input: {
        schema: {
            body: zLobuReadKnowledgeBody.extend({
                query: zLobuReadKnowledgeBody.shape.query.unwrap().min(1)
                    .regex(/\S/).optional(),
                content_ids: z.array(z.number().int().min(1)).min(1).max(100)
                    .optional(),
                entity_id: zLobuReadKnowledgeBody.shape.entity_id.unwrap()
                    .min(1).optional(),
                platforms: z.array(z.string().min(1).regex(/\S/)).min(1)
                    .optional(),
                semantic_type: zLobuReadKnowledgeBody.shape.semantic_type
                    .unwrap().min(1).regex(/\S/).optional(),
                entity_types: z.array(z.string().min(1).regex(/\S/)).min(1)
                    .optional(),
                min_similarity: zLobuReadKnowledgeBody.shape.min_similarity
                    .unwrap().min(0).max(1).optional(),
                vector_weight: zLobuReadKnowledgeBody.shape.vector_weight
                    .unwrap().min(0).max(1).optional(),
                since: zLobuReadKnowledgeBody.shape.since.unwrap().min(1)
                    .regex(/\S/).optional(),
                until: zLobuReadKnowledgeBody.shape.until.unwrap().min(1)
                    .regex(/\S/).optional(),
                limit: zLobuReadKnowledgeBody.shape.limit.unwrap().min(1)
                    .max(100).optional(),
                offset: zLobuReadKnowledgeBody.shape.offset.unwrap().min(0)
                    .optional(),
            }).strict(),
        },
    },
});
