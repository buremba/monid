import { assert, assertEquals, assertRejects } from "@std/assert";
import { fromFileUrl } from "@std/path";
import type { Json, RunInput } from "@shared/core";
import {
    directTransport,
    Engine,
    EngineError,
    EngineErrorCode,
} from "@monid/connector-engine";
import {
    loadFixture,
    runEndpoint,
    testBundle,
    testSealedUnit,
} from "@shared/testing";

const FIXTURES = fromFileUrl(new URL("./fixtures/", import.meta.url));
const BASE = "https://app.lobu.ai/api/market/";

/**
 * One recorded happy chain per endpoint. The connector maps nothing, so the
 * recorded body IS the contract: a dropped source URL, entity field, or
 * coverage block must fail.
 */
const HAPPY: Record<string, { fixture: string; input: RunInput }> = {
    "lobu#api/market/search_memory": {
        fixture: "search-memory-ok",
        input: {
            body: {
                query: "Anthropic",
                entity_type: "company",
                limit: 1,
                content_limit: 1,
            },
        },
    },
    "lobu#api/market/read_knowledge": {
        fixture: "read-knowledge-ok",
        input: {
            body: {
                content_ids: [2286657],
            },
        },
    },
    "lobu#api/market/search_sdk": {
        fixture: "search-sdk-ok",
        input: {
            body: {
                query: "feeds",
                mode: "read",
                limit: 2,
            },
        },
    },
};
const IDS = Object.keys(HAPPY).sort();

const FREE = { credits: {}, evidence: {} };

async function replay(id: string, fixture: string, input: RunInput) {
    const unit = await testSealedUnit(id);
    const fx = await loadFixture(`${FIXTURES}${fixture}.json`);
    return {
        result: await runEndpoint({ unit, input, mode: "replay", fixture: fx }),
        recorded: fx.calls[0].res.body,
    };
}

Deno.test("lobu: three read-only POSTs, keyless, FREE, nothing mapped, upgrade notes merged", async () => {
    const bundle = await testBundle();
    const ids = Object.keys(bundle.endpoints).filter((id) =>
        id.startsWith("lobu#")
    ).sort();
    // read-only on purpose: no write or session-only tool is ported
    assertEquals(ids, IDS);

    const authKey = bundle.endpoints[ids[0]].auth.inject.$fn.key;
    const synthesizedKey = bundle.endpoints[ids[0]].usage.evidence.$fn.key;
    assertEquals(
        bundle.fnTable[synthesizedKey].provenance,
        "core#usage.synthesizedEmpty",
    );
    for (const id of ids) {
        const doc = bundle.endpoints[id];
        const tool = id.slice("lobu#api/market/".length);
        assertEquals(doc.request.method, "POST", id);
        assertEquals(doc.request.url, BASE + tool, id);
        // keyless: one identity inject, an empty credential shape
        assertEquals(doc.auth.inject.$fn.key, authKey, id);
        assertEquals(
            Object.keys(
                (doc.auth.credentials as { properties?: object })
                    .properties ?? {},
            ),
            [],
            id,
        );
        // FREE: no meter, compiler-synthesized quantities
        assertEquals(doc.usage.model.kind, "FREE", id);
        assertEquals(doc.usage.consolidate, undefined, id);
        assertEquals(doc.usage.evidence.$fn.key, synthesizedKey, id);
        assertEquals(doc.usage.estimate.$fn.key, synthesizedKey, id);
        // the vendor's JSON passes through untouched
        assertEquals(doc.input.toRequest, undefined, id);
        assertEquals(doc.output.fromResponse, undefined, id);
        assertEquals(doc.output.fromError, undefined, id);
        assertEquals(doc.timeouts.requestMs, 25_000, id);
        assertEquals(doc.timeouts.runMs, 30_000, id);
        // provider upgrade notes merge into every endpoint doc so `monid inspect`
        // tells agents how to connect user credentials for social scraping
        const notesText = (doc.meta.notes ?? []).join(" ");
        assert(notesText.includes("tiktok.web"), id);
        assert(notesText.includes("linkedin"), id);
        assert(
            notesText.includes("npx @lobu/cli@latest init --from-org market"),
            id,
        );
    }
});

Deno.test("lobu: happy chains (recorded 2026-10-24) replay verbatim at zero usage", async () => {
    for (const [id, { fixture, input }] of Object.entries(HAPPY)) {
        const { result, recorded } = await replay(id, fixture, input);
        assertEquals(result.httpStatus, 200, id);
        assertEquals(result.isProviderError, false, id);
        assertEquals(result.usage, FREE, id);
        assertEquals(result.output, recorded, id);
    }
});

Deno.test("lobu: answers keep their entity identifiers, source URLs, permalinks, and SDK docs", async () => {
    const memory = (
        await replay(
            "lobu#api/market/search_memory",
            HAPPY["lobu#api/market/search_memory"].fixture,
            HAPPY["lobu#api/market/search_memory"].input,
        )
    ).result.output as {
        entity: {
            id: number;
            name: string;
            metadata: { qid: string; domain: string; linkedin_url: string };
        };
        view_url: string;
        content: { id: number; source_url: string; platform: string }[];
    };
    assertEquals(memory.entity.id, 55199);
    assertEquals(memory.entity.name, "Anthropic");
    assertEquals(memory.entity.metadata.qid, "Q116758847");
    assertEquals(memory.entity.metadata.domain, "anthropic.com");
    assertEquals(
        memory.entity.metadata.linkedin_url,
        "https://www.linkedin.com/company/anthropicresearch",
    );
    assertEquals(
        memory.view_url,
        "https://app.lobu.ai/market/company/anthropic",
    );
    assertEquals(memory.content.length, 1);
    assert(memory.content[0].source_url.startsWith("https://reddit.com/"));

    const knowledge = (
        await replay(
            "lobu#api/market/read_knowledge",
            HAPPY["lobu#api/market/read_knowledge"].fixture,
            HAPPY["lobu#api/market/read_knowledge"].input,
        )
    ).result.output as {
        content: {
            id: number;
            platform: string;
            source_url: string;
            permalink: string;
        }[];
    };
    assertEquals(knowledge.content.length, 1);
    assertEquals(knowledge.content[0].id, 2286657);
    assertEquals(knowledge.content[0].platform, "reddit");
    assertEquals(
        knowledge.content[0].source_url,
        "https://reddit.com/r/webdev/comments/1kam74j/ai_coding_assistants_inside_ides_are_about_to/",
    );
    assertEquals(
        knowledge.content[0].permalink,
        "https://app.lobu.ai/market/events/2286657",
    );

    const sdk = (
        await replay(
            "lobu#api/market/search_sdk",
            HAPPY["lobu#api/market/search_sdk"].fixture,
            HAPPY["lobu#api/market/search_sdk"].input,
        )
    ).result.output as {
        match_count: number;
        results: string[];
    };
    assertEquals(sdk.match_count, 3);
    assertEquals(sdk.results.length, 2);
    assert(sdk.results[0].startsWith("feeds.list —"));
});

Deno.test("lobu: empty answers are 200s with empty collections and zero usage", async () => {
    const memoryEmpty = await replay(
        "lobu#api/market/search_memory",
        "search-memory-empty",
        { body: { query: "zzqxvqqq999", include_content: false, limit: 1 } },
    );
    assertEquals(memoryEmpty.result.httpStatus, 200);
    assertEquals(memoryEmpty.result.isProviderError, false);
    assertEquals(memoryEmpty.result.usage, FREE);
    assertEquals(memoryEmpty.result.output, memoryEmpty.recorded);
    assertEquals(
        (memoryEmpty.result.output as { matches: unknown[] }).matches,
        [],
    );

    const knowledgeEmpty = await replay(
        "lobu#api/market/read_knowledge",
        "read-knowledge-empty",
        { body: { content_ids: [999999999] } },
    );
    assertEquals(knowledgeEmpty.result.httpStatus, 200);
    assertEquals(knowledgeEmpty.result.isProviderError, false);
    assertEquals(knowledgeEmpty.result.usage, FREE);
    assertEquals(knowledgeEmpty.result.output, knowledgeEmpty.recorded);
    assertEquals(
        (knowledgeEmpty.result.output as { content: unknown[] }).content,
        [],
    );

    const sdkEmpty = await replay(
        "lobu#api/market/search_sdk",
        "search-sdk-empty",
        { body: { query: "zzqxvqqq999" } },
    );
    assertEquals(sdkEmpty.result.httpStatus, 200);
    assertEquals(sdkEmpty.result.isProviderError, false);
    assertEquals(sdkEmpty.result.usage, FREE);
    assertEquals(sdkEmpty.result.output, sdkEmpty.recorded);
    assertEquals(
        (sdkEmpty.result.output as { match_count: number }).match_count,
        0,
    );
});

Deno.test("lobu: vendor 4xx/5xx are data, zero usage, body untouched", async () => {
    const cases: [string, string, RunInput, number][] = [
        // recorded: unknown/unshared entity_id on read_knowledge returns 403
        [
            "lobu#api/market/read_knowledge",
            "read-knowledge-unknown-entity",
            { body: { entity_id: 999999999, limit: 1 } },
            403,
        ],
        // synthetic rate-limit and maintenance shapes
        [
            "lobu#api/market/search_memory",
            "synthetic-rate-limited",
            {
                body: {
                    query: "Anthropic",
                    entity_type: "company",
                    limit: 1,
                    content_limit: 1,
                },
            },
            429,
        ],
        [
            "lobu#api/market/search_memory",
            "synthetic-maintenance",
            {
                body: {
                    query: "Anthropic",
                    entity_type: "company",
                    limit: 1,
                    content_limit: 1,
                },
            },
            503,
        ],
    ];
    for (const [id, fixture, input, status] of cases) {
        const { result, recorded } = await replay(id, fixture, input);
        assertEquals(result.httpStatus, status, fixture);
        assertEquals(result.isProviderError, true, fixture);
        assertEquals(result.usage, FREE, fixture);
        assertEquals(result.output, recorded, fixture);
    }
});

Deno.test("lobu: the binding rejects what the vendor would 400, before any call", async () => {
    // recorded vendor 400s that the bindings pre-empt
    for (const fixture of ["search-memory-bad-input", "search-sdk-bad-input"]) {
        const fx = await loadFixture(`${FIXTURES}${fixture}.json`);
        assertEquals(fx.calls[0].res.status, 400, fixture);
        assert(
            typeof (fx.calls[0].res.body as { error?: string }).error ===
                "string",
            fixture,
        );
    }

    const rejected: [string, Json][] = [
        ["search_memory", {}],
        ["search_memory", { query: "" }],
        ["search_memory", { query: "   " }],
        ["search_memory", { entity_id: 0 }],
        ["search_memory", { entity_id: -1 }],
        ["search_memory", { entity_id: 1.5 }],
        ["search_memory", { query: "Anthropic", limit: 0 }],
        ["search_memory", { query: "Anthropic", limit: 101 }],
        ["search_memory", { query: "Anthropic", limit: 2.5 }],
        ["search_memory", { query: "Anthropic", content_limit: 0 }],
        ["search_memory", { query: "Anthropic", content_limit: 51 }],
        ["search_memory", { query: "Anthropic", min_similarity: -0.1 }],
        ["search_memory", { query: "Anthropic", min_similarity: 1.1 }],
        ["search_memory", { query: "Anthropic", unknown_field: true }],
        ["read_knowledge", { query: "" }],
        ["read_knowledge", { query: "   " }],
        ["read_knowledge", { content_ids: [] }],
        ["read_knowledge", { content_ids: [0] }],
        ["read_knowledge", { content_ids: [1.5] }],
        ["read_knowledge", { entity_id: 0 }],
        ["read_knowledge", { entity_id: 1.5 }],
        ["read_knowledge", { platforms: [] }],
        ["read_knowledge", { platforms: [""] }],
        ["read_knowledge", { limit: 0 }],
        ["read_knowledge", { limit: 101 }],
        ["read_knowledge", { limit: 1.5 }],
        ["read_knowledge", { offset: -1 }],
        ["read_knowledge", { min_similarity: -0.1 }],
        ["read_knowledge", { min_similarity: 1.5 }],
        ["read_knowledge", { vector_weight: -0.1 }],
        ["read_knowledge", { vector_weight: 1.5 }],
        ["read_knowledge", { sort_by: "popularity" }],
        ["read_knowledge", { sort_order: "sideways" }],
        ["search_sdk", {}],
        ["search_sdk", { query: "" }],
        ["search_sdk", { query: "   " }],
        ["search_sdk", { query: "feeds", mode: "admin" }],
        ["search_sdk", { query: "feeds", limit: 0 }],
        ["search_sdk", { query: "feeds", limit: 101 }],
        ["search_sdk", { query: "feeds", limit: 1.5 }],
    ];
    for (const [tool, body] of rejected) {
        // no fixture: any upstream call would itself fail the test
        const unit = await testSealedUnit(`lobu#api/market/${tool}`);
        await assertRejects(
            () => runEndpoint({ unit, input: { body }, mode: "replay" }),
            Error,
            "INVALID_INPUT",
            `${tool} ${JSON.stringify(body)}`,
        );
    }

    // boundary-valid twins clear the gate
    const passing: [string, string, Json][] = [
        [
            "search_memory",
            "search-memory-ok",
            { query: "Anthropic", limit: 1, content_limit: 50 },
        ],
        [
            "search_memory",
            "search-memory-ok",
            { entity_id: 55199, limit: 100, min_similarity: 0.5 },
        ],
        [
            "read_knowledge",
            "read-knowledge-ok",
            {
                query: "Cursor",
                platforms: ["reddit"],
                sort_by: "score",
                sort_order: "desc",
                include_total: false,
                limit: 100,
                offset: 0,
            },
        ],
        [
            "search_sdk",
            "search-sdk-ok",
            { query: "feeds", mode: "full", limit: 100 },
        ],
    ];
    for (const [tool, fixture, body] of passing) {
        const ok = await replay(`lobu#api/market/${tool}`, fixture, { body });
        assertEquals(ok.result.isProviderError, false, JSON.stringify(body));
    }
});

interface CapturedInit {
    method?: string;
    headers?: unknown;
    body?: unknown;
    signal?: AbortSignal | null;
}

/** Engine wired to a capturing fetch: what actually leaves the process. */
function captureEngine(
    seen: { url: string; init: CapturedInit }[],
    respond: (signal?: AbortSignal | null) => Promise<Response>,
) {
    return new Engine({
        transport: directTransport({
            params: () => Promise.resolve({}),
            fetch: (input, init) => {
                const captured = (init ?? {}) as CapturedInit;
                seen.push({ url: String(input), init: captured });
                return respond(captured.signal);
            },
        }),
    });
}

Deno.test("lobu: egress is bare: no key, no tracking, body as given", async () => {
    const seen: { url: string; init: CapturedInit }[] = [];
    const engine = captureEngine(seen, () =>
        Promise.resolve(
            new Response(
                JSON.stringify({ query: "feeds", match_count: 0, results: [] }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" },
                },
            ),
        ));
    const unit = await testSealedUnit("lobu#api/market/search_sdk");
    const loaded = await engine.load(unit);
    const body = { query: "feeds", mode: "read" };
    const result = await loaded.run({ body });
    assertEquals(result.output, {
        query: "feeds",
        match_count: 0,
        results: [],
    });
    assertEquals(seen.length, 1);
    assertEquals(seen[0].url, BASE + "search_sdk");
    assertEquals(seen[0].init.method, "POST");
    assertEquals(seen[0].init.headers, { "content-type": "application/json" });
    assertEquals(JSON.parse(String(seen[0].init.body)), body);
});

Deno.test("lobu: a non-JSON 500 from the edge is data, zero usage", async () => {
    const seen: { url: string; init: CapturedInit }[] = [];
    const engine = captureEngine(seen, () =>
        Promise.resolve(
            new Response("error code: 502", {
                status: 500,
                headers: { "content-type": "text/plain" },
            }),
        ));
    const unit = await testSealedUnit("lobu#api/market/search_memory");
    const loaded = await engine.load(unit);
    const result = await loaded.run({ body: { query: "Anthropic" } });
    assertEquals(result.httpStatus, 500);
    assertEquals(result.isProviderError, true);
    assertEquals(result.usage, FREE);
    assertEquals(result.output, "error code: 502");
    assertEquals(seen.length, 1);
});

Deno.test("lobu: a hung upstream is cut off at requestMs", async () => {
    const seen: { url: string; init: CapturedInit }[] = [];
    const engine = captureEngine(
        seen,
        (signal) =>
            new Promise((_, reject) =>
                signal?.addEventListener(
                    "abort",
                    () => reject(new DOMException("aborted", "AbortError")),
                )
            ),
    );
    const unit = await testSealedUnit("lobu#api/market/search_sdk");
    const loaded = await engine.load({
        ...unit,
        doc: {
            ...unit.doc,
            timeouts: { ...unit.doc.timeouts, requestMs: 50 },
        },
    });
    const error = await assertRejects(
        () => loaded.run({ body: { query: "feeds" } }),
        EngineError,
    );
    assertEquals(error.code, EngineErrorCode.EXECUTION_FAILED);
    assert(error.message.includes("abort"), error.message);
    assertEquals(seen.length, 1);
});

Deno.test("lobu: fixtures stay small (largest response under 10 KiB)", async () => {
    for await (const entry of Deno.readDir(FIXTURES)) {
        const bytes = (await Deno.stat(`${FIXTURES}${entry.name}`)).size;
        assert(bytes < 10_240, `${entry.name} is ${bytes} bytes`);
    }
});

Deno.test({
    name: "lobu live (gated on LOBU_LIVE=1; keyless, free)",
    ignore: Deno.env.get("LOBU_LIVE") !== "1",
    fn: async () => {
        for (const [id, { input }] of Object.entries(HAPPY)) {
            const unit = await testSealedUnit(id);
            const result = await runEndpoint({ unit, input, mode: "live" });
            assertEquals(
                result.isProviderError,
                false,
                `${id} ${JSON.stringify(result.output)}`,
            );
            assertEquals(result.usage, FREE, id);
            assertEquals(typeof result.output, "object", id);
            assert(result.output !== null, id);
        }
    },
});
