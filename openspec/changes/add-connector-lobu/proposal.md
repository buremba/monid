# Proposal: add-connector-lobu

## Why

Lobu (lobu.ai) is an open-source workspace, knowledge graph, and runtime for AI
teammates. Its public `market` workspace (`https://app.lobu.ai/market`) exposes
45,000+ enriched companies, AI/SaaS products, and people alongside 200,000+
indexed community discussions (Reddit), software reviews (Trustpilot), and
company web snapshots, plus discovery over Lobu's TypeScript SDK and
user-authenticated social connectors (`tiktok.web`, `linkedin`, `x`, `reddit`,
`whatsapp.web`, `chrome`).

This change makes Lobu's keyless, read-only public REST surface discoverable
through Monid at zero cost (`UsageModelKind.FREE`), covering
`company-enrichment`, `people-enrichment`, `company-reviews`, `reddit`,
`linkedin`, `tiktok`, `twitter`, `web-scraping`, and `agents`, while documenting
the upgrade path (`npx @lobu/cli@latest init --from-org market` /
`https://lobu.ai/mcp`) for agents that need to scrape social platforms using
their user's own logged-in credentials or run isolated TypeScript sandboxes.

## What Changes

- **connectors/lobu**: three synchronous JSON POSTs on `https://app.lobu.ai`:
  - `lobu#api/market/search_memory` (`POST /api/market/search_memory`): fuzzy
    entity resolution + hybrid vector/keyword content recall across the public
    `market` workspace.
  - `lobu#api/market/read_knowledge` (`POST /api/market/read_knowledge`):
    full-text reader over 200,000+ Reddit threads, Trustpilot software reviews,
    and company web pages by `content_ids`, `entity_id`, `query`, `platforms`,
    or `semantic_type`.
  - `lobu#api/market/search_sdk` (`POST /api/market/search_sdk`): discovery
    over Lobu's TypeScript SDK namespaces (`feeds`, `operations`, `connections`,
    `automations`, `entities`, `catalog`, `knowledge`, `metrics`) and sandbox
    capabilities.
  - **Read-only.** Write, administrative, and session-scoped tools
    (`save_memory`, `query_sdk`, `run_sdk`, `query_sql`, `open_view`) are not
    ported.
  - **Keyless.** Empty credential shape (`z.object({})`) and identity
    `auth.inject` (`({ data }) => data.request`).
  - **FREE.** Provider-level `UsageModelKind.FREE`: no credit pool, no
    `usage.consolidate`, compiler-synthesized quantities.
  - **Nothing mapped.** Responses pass through untouched (`output.fromResponse`
    is undefined) so `source_url`, `permalink`, `view_url`, `occurred_at`,
    `similarity`, and `coverage` reach the caller verbatim.
  - **Bindings** enforce the vendor's documented bounds before any network call:
    `search_memory` requires `query` (non-whitespace) or `entity_id` (positive
    int), `limit` 1-100, `content_limit` 1-50, `min_similarity` 0-1;
    `read_knowledge` enforces positive int IDs, `limit` 1-100, `offset` >= 0,
    `min_similarity` / `vector_weight` 0-1, `sort_by` (`date` | `score`),
    `sort_order` (`asc` | `desc`); `search_sdk` requires non-whitespace `query`,
    `mode` (`read` | `full`), `limit` 1-100.
  - **Timeouts** 25 s request / 30 s run.
- **Fixtures**: recorded from the public API (`https://app.lobu.ai/api/market/*`)
  on 2026-10-24 plus synthetic 429/503 error shapes.
- **ids.lock.json**: the three new `lobu#` endpoint ids.

## Capabilities

- `lobu-connector`.

## Non-goals

- No engine, schema, preset, category, or test-tooling change;
  `ENGINE_VERSION` untouched.
- No per-user browser session forwarding inside Monid: authenticated social
  scraping (`tiktok.web`, `linkedin`, `x`, `reddit`, `whatsapp.web`, `chrome`)
  and V8 sandboxes (`query_sdk` / `run_sdk`) are documented as the direct Lobu
  workspace upgrade path.

## Impact

New connector tree `connectors/lobu`, three ids in `connectors/ids.lock.json`,
`openspec/changes/add-connector-lobu`. No contract change.
