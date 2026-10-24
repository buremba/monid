# Proposal: add-connector-lobu

## Why

Agents investigating product complaints, comparing software, or adding customer
feedback to a company brief need inspectable source material. Lobu's public
Market workspace provides stored discussions through a free, read-only JSON
endpoint. The complete research workflow works without a Lobu account or an
off-platform purchase.

Users may optionally continue in Lobu to connect their own accounts and browser
and combine public research with private workspace context. Those connections
happen separately in Lobu; Monid calls do not acquire a user's private data or
execute authenticated capabilities.

## What changes

- Add one synchronous, keyless JSON POST endpoint on `https://app.lobu.ai`:
  `lobu#api/market/read_knowledge`. It searches discussions by query and reads
  source text by returned content IDs; entity lookup is unnecessary.
- Declare `FREE` usage, empty credentials, identity auth injection, and 25/30 s
  request/run timeouts. No pool, lifecycle, or engine changes are introduced.
- Preserve upstream response bodies, including source links, dates, pagination,
  provider errors, and empty results. No generated research verdict is added.
- Limit categories to company reviews and Reddit. Describe stored-data coverage,
  relevance, rate limits, and version history in operational notes.
- Keep the optional continuation in the provider description and homepage link.
  Do not advertise authenticated scraping, SDK execution, or developer sandboxes.
- Add recorded fixtures, explicitly synthetic failure fixtures, replay/egress/
  input-gate tests, and an opt-in live search-to-read test with source/date checks.
- Add only the reader's Lobu endpoint ID to `connectors/ids.lock.json`.

## Example workflows and observed evidence

1. `Linear pricing complaints`: a live anonymous query returned three results;
   search and source reading completed in 6.6 s, including a discussion dated
   2025-07-01 about a [$750 invoice](https://reddit.com/r/Linear/comments/1lowdxh/750_invoice_from_linear_why_is_it_so_expensive/).
2. `Notion alternatives`: three results; search and source reading completed in
   4.2 s, including a [discussion](https://reddit.com/r/Notion/comments/1tjz2p9/best_notion_alternatives_youve_actually_stuck_with/)
   dated 2026-05-21.
3. Add these customer-discussion sources to a company brief assembled with other
   Monid providers for enrichment or news.

These are two bounded checks on 2026-10-24, not a comprehensive relevance,
capacity, or freshness benchmark. Exact ID reads can expand a source's version
history, oldest first. The live test follows pagination to a current version and
checks stable source identity; repeated versions are not independent reviews.

## Distribution and optional continuation

The standalone free result is the entry point. Source and permalink links let a
person inspect the research. A user may open Lobu, create or select their own
workspace, connect selected accounts or their browser, and continue with private
context. The connector does not create that workspace, forward a Monid identity,
or make an account connection automatically.

Do not use `init --from-org market` as onboarding: it exports an existing
organization, not a personal workspace. Do not supply a bare managed OAuth URL:
connection setup requires server-generated options and user authorization.
The landing page links to workspace creation, agent setup, and login; the live
browser reached the workspace and connector picker using an existing session.
First-time signup and account/browser authorization remain unverified.

Acceptance is not a ranking or traffic guarantee. After hosted activation,
measure whether discovery finds Lobu for the example tasks, whether answers cite
relevant sources, then visits, first account connections, and repeat use. This PR
adds no attribution contract or tracking surface. A distribution experiment should
start with customer feedback and software comparisons rather than broad company
enrichment where other providers are stronger.

## Live Market readiness check (2026-10-24)

The actual Monid connector passed all 11 tests again, including anonymous
search-to-source reading. Eight broader research queries each returned HTTP 200
in roughly 3.9–5.2 s; the query-only defaults also completed (50 rows, about
142 KiB, 5.4 s). An unknown content ID returned an empty 200 response.

This does not establish full readiness:

- Linear, Notion, Slack, HubSpot, Cursor, and Anthropic queries yielded relevant
  examples, but broad Salesforce and Datadog queries returned tangential matches.
  A brand-only query with `min_similarity: 1` and `vector_weight: 0` returned
  brand mentions in the bounded follow-up. A mention still does not prove the
  specific claim requested (for example pricing complaints).
- Some current rows are duplicate copies of the same source item, including
  different origin formats on the same connection. Do not count raw rows as
  independent reviews. Resolve source identity and provenance before deduping;
  a review-site landing URL alone cannot distinguish individual reviews.
- The newest anonymous Reddit rows were dated 2026-07-17. Website rows included
  2026-10-24. An unrestricted recent Notion query also returned entity-update
  records; selecting the requested source platforms excluded those records.
  The different source freshness levels need collection-health verification.
- A Python urllib probe was rejected by Cloudflare with HTTP 403 / code 1010,
  while the actual Monid/Deno execution succeeded. Hosted Monid egress remains
  unverified; do not assume local success proves edge compatibility everywhere.
- Returned event links served the frontend HTML and its JavaScript assets when
  requested as HTML. Bare generic GETs returned the service-root JSON response.
  This verifies delivery, not the final rendered browser interaction.

The connected Lobu OAuth grant explicitly rejected Market workspace access,
although account discovery confirmed membership and public visibility. Feed,
connection, and Automation health checks and repairs are pending renewed Market
consent. No alternative credential or authenticated browser path was used to
bypass that denial. Hold submission until these operating issues are checked and
resolved or their supported scope is made explicit.

## Maintainer review request

Please review this free, keyless public-discussion source for hosted admission.
Can hosted provider configuration accept the empty credential shape, and can we
verify discover/inspect/run for the example queries from shared egress? Please
also confirm whether the optional homepage continuation meets listing policy.
The PR does not require account pooling or user credentials. Hosted acceptance
and discoverability must be demonstrated; local compilation alone proves neither.

## Validation and remaining gates

- Focused connector tests, scoped typecheck, formatting/lint, deterministic double
  compile, and the version gate are recorded in tasks.md.
- Full upstream check/test currently fail on 24 existing OpenAI test typing
  errors. Untouched origin/main reproduces those diagnostics. The IDs gate also
  has unrelated pre-existing drift, identical on untouched origin/main.
- Full hosted keyless configuration, shared-egress capacity, and hosted discovery
  relevance still need maintainer validation. No guaranteed capacity or coverage
  is offered, and no automatic recommendation or conversion is claimed.
- A separate Lobu change makes entity-lookup suggestions match caller access.
  It is not required by this discussion-only connector and is not deployed here.

## Deferred scope and non-goals

Company/entity lookup and SDK discovery are excluded. Public name lookup has
returned an operational workflow entity; its metadata visibility is not a platform
access rule. A later company-lookup proposal needs publication rules resolved in
the owning workspace or a separately approved generic contract. This connector
must not silently filter or reinterpret vendor data.

No engine/schema changes, resource lifecycle, private workspace execution,
per-user credential forwarding, billing pools, or automatic account onboarding.
