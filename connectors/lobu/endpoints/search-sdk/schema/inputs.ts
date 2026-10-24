import { z } from "zod";
import { zLobuSdkSearchMode } from "../../../schema/common.ts";

/**
 * POST /api/market/search_sdk body, mirrored from the published OpenAPI
 * (`https://app.lobu.ai/openapi.json`, read 2026-10-24). Optionality only
 * (D25): `query` non-whitespace and `limit` bounds (1-100) live at the binding.
 */
export const zLobuSearchSdkBody = z.object({
    query: z.string().describe(
        "SDK method or runtime-helper discovery query. Pass a namespace " +
            "(e.g. 'feeds', 'operations', 'connections', 'automations', " +
            "'entities', 'catalog', 'knowledge', 'metrics'), dotted method " +
            "names (e.g. 'feeds.readMany operations.listAvailable'), or " +
            "free-text keywords.",
    ),
    mode: zLobuSdkSearchMode.describe(
        "Filter results to `query_sdk`-safe read methods (`'read'`) or full " +
            "`run_sdk` methods (`'full'`, default).",
    ).optional(),
    limit: z.number().int().describe(
        "Maximum number of SDK method matches to return (1-100, default: 20).",
    ).optional(),
});
