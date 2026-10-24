# Tasks: add-connector-lobu

## 1. Provider

- [x] 1.1 provider.ts: baseUrl (`https://app.lobu.ai`), keyless auth (empty
      credentials + identity inject), timeouts 25/30 s, FREE model, meta +
      upgrade path notes
- [x] 1.2 schema/common.ts: sort order, knowledge sort axis, and SDK search
      mode enums

## 2. Endpoints (3)

- [x] 2.1 search_memory, read_knowledge, search_sdk: faithful mirror per
      endpoint, vendor bounds at the binding, identity = wire path
- [x] 2.2 ids.lock.json: the three `lobu#` ids

## 3. Fixtures + tests

- [x] 3.1 Recorded fixtures from `https://app.lobu.ai/api/market/*` (2026-10-24,
      public data, no request headers kept) + synthetic 429/503 error shapes
- [x] 3.2 provider.test.ts: compiled shape (3 ids, urls, keyless, FREE, nothing
      mapped), recorded happy replays equal the body, sources and metadata
      survive, empty answers, 400/403/429/503/500 as zero-billed data, binding
      gates with no upstream call, bare egress, request timeout, fixture size,
      live run gated on `LOBU_LIVE=1`

## 4. Verify

- [x] 4.1 fmt · lint · check · test · double-compile · version:check ·
      ids:check · catalog endpoints (3) · live run against the public API
