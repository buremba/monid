# lobu-connector (delta)

## ADDED Requirements

### Requirement: Keyless, free provider

The lobu provider SHALL declare name `lobu`, `request.baseUrl`
`https://app.lobu.ai`, an empty credential shape, an identity `auth.inject`,
timeouts 25 s request / 30 s run, and usage model `FREE`. It SHALL NOT declare
a credit pool, `usage.consolidate`, a lifecycle, `input.toRequest`,
`output.fromResponse`, or `output.fromError`.

#### Scenario: Nothing is added to the request

- **WHEN** any lobu endpoint runs
- **THEN** the request carries only `content-type: application/json` and the
  validated body, no credential is resolved, and nothing is billed

### Requirement: Read-only public market surface

The connector SHALL expose `lobu#api/market/search_memory`,
`lobu#api/market/read_knowledge`, and `lobu#api/market/search_sdk`, each a
`POST` whose identity is its wire path. No endpoint that mutates workspace state
SHALL be declared.

#### Scenario: The compiled bundle holds three reads

- **WHEN** the bundle is compiled
- **THEN** the `lobu#` ids are `lobu#api/market/read_knowledge`,
  `lobu#api/market/search_memory`, and `lobu#api/market/search_sdk`

### Requirement: Answers pass through verbatim

Every response SHALL reach the caller as the vendor sent it.

#### Scenario: Entity metadata, source URLs, and coverage survive

- **WHEN** `search_memory`, `read_knowledge`, or `search_sdk` returns a 200
  response
- **THEN** the output equals the recorded body with `source_url`, `permalink`,
  `view_url`, and `coverage` preserved untouched

#### Scenario: Vendor errors are zero-billed data

- **WHEN** the vendor answers 400, 403, 429, 503, or 500
- **THEN** `isProviderError` is true, usage is `{credits: {}, evidence: {}}`,
  and the body passes through untouched

### Requirement: Bindings carry the vendor's bounds

Inputs SHALL mirror the published OpenAPI with optionality only, and the
bindings SHALL reject what the vendor documents as invalid before any call.

#### Scenario: Out-of-bounds input never reaches the vendor

- **WHEN** a caller sends `{}` or whitespace-only `query` to `search_memory`,
  whitespace-only `query` to `search_sdk`, or out-of-range `limit`,
  `content_limit`, `min_similarity`, `vector_weight`, `sort_by`, or `sort_order`
- **THEN** the run fails with `INVALID_INPUT` and no upstream call is made
