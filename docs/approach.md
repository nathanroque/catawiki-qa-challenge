# Engineering Approach

This document explains why the implementation evolved as it did. Current scenario status belongs in the [test plan](test-plan.md); production observations belong in [findings](findings.md).

## 1. Establish the assignment baseline

The first goal was the required customer journey: open Catawiki, search for `Train`, verify results, open the second lot, and report the lot title, favourite count, and displayed bidding information.

The first meaningful strengthening was identity continuity. A lot page merely opening was not enough: the test captures the second card's runtime title and lot ID, then validates the destination URL and page heading.

The search keyword later moved to `support/test-data.ts`. `Train` remains the canonical default, while `SEARCH_KEYWORD` allows bounded local exploration without editing source.

## 2. Explore before abstracting

The initial flow was implemented directly, then observed through the DOM, accessibility tree, browser behavior, and network traffic. Small Page Objects were introduced only after repeated page responsibilities became clear:

- `SearchPage` owns landing-page search and locale interactions;
- `SearchResultsPage` owns result identity and selection;
- `LotPage` owns visible title, favourite count, and bidding-state extraction.

Tests retain business assertions. `CatawikiApiClient` similarly owns request construction but not response expectations. This separation is recorded in
[ADR 003 — Page Object Model](adr/003-page-object-model.md).

No base-page hierarchy, fixture layer, dependency-injection container, or Cucumber execution layer was introduced because the current suite does not present a problem that requires them.

## 3. Treat production as a constrained environment

The public production application is dynamic and externally owned. The suite therefore:

- uses anonymous read-only behavior;
- discovers lot IDs and values at runtime;
- validates identity and relationships rather than fixed production values;
- bounds parallel traffic;
- avoids state changes and access-control bypasses.

The durable policy belongs in the [production guardrails ADR](adr/004-production-test-guardrails.md). Observed edge behavior belongs in [findings](findings.md#environment-and-ci-observations).

## 4. Add layers for distinct confidence

Additional coverage was selected only when it addressed a different risk.

### Direct API behavior

Network exploration identified public read-only feed, navigation, and bidding endpoints used by normal anonymous behavior. The navigation test checks relationships more directly and cheaply than a browser journey could.

### UI/API integration

The bidding integration test begins with the real search flow, then correlates the same runtime lot with the public bidding endpoint. It compares favourite count and displayed euro bid amount rather than stopping at HTTP success or ID presence.

### Focused runtime validation

The validators check the response fields and invariants consumed by the tests. Fourteen deterministic unit cases exercise their accepted and rejected shapes in hosted CI. This is intentionally narrower than a full provider contract.

Sanitized evidence is retained in [API samples](api-samples/README.md), not as fixtures.

### Accessibility

Axe scans initially exposed serious and critical findings already present in production. A zero-violation gate would have remained permanently red, while logging alone would provide no regression assertion. Page-specific rule-ID baselines preserve a coarse signal for new high-severity categories. See
[ADR 006 — Accessibility Baseline](adr/006-accessibility-baseline.md) and the [observed findings](findings.md#accessibility-observations).

## 5. Reliability hardening from observed failures

### Web-first result readiness

The second-result precondition uses a locator assertion instead of `locator.count()`. A count is an immediate snapshot; `toBeVisible()` waits for the actual prerequisite needed by the journey.

### Usercentrics consent

Fresh contexts can render application UI before Usercentrics finishes initialization. Investigation showed an open shadow root under `aside#usercentrics-cmp-ui`; `#uc-overlay` is the full-screen pointer blocker, and `#uc-close-icon` is the public decline action without a reliable role or stable localized label.

The helper waits for the overlay, clicks the scoped action, and waits for the blocker to become hidden. It uses no fixed sleep, forced click, general retry, or opaque storage preload. Only the expected Playwright timeout means the optional overlay did not appear.

### Responsive UI

The mobile header hides the search combobox until a dedicated control opens it. Lot pages may render multiple responsive bidding representations simultaneously. Shared Page Objects respond to visible UI state rather than maintaining separate desktop and mobile implementations.

### Search-result views

Gallery and normal views share the lot-container identity contract but use different title markup. The normal-view P2 scenario exposed and now protects that coupling, including persistence after back navigation and reload.

### Accessibility readiness

The three Axe scenarios are independent. Search results must be visible before the results scan, and the lot heading must be visible before the lot-page scan. This avoids serial failure dependencies.

## 6. Execution strategy

The default suite uses Chromium, two local workers, `fullyParallel: false`, and zero retries. Cross-browser smoke reuses P0 across Chromium, Firefox, and WebKit with one worker and a 45-second timeout. Accessibility and I18N use scoped 60- and 45-second test budgets respectively.

These settings followed repeated execution, not a general belief that production always requires serialization or longer timeouts. The cross-browser rationale is recorded in `docs/adr/007-cross-browser-execution-strategy.md` in the current repository.

## 7. Hosted CI strategy

An early GitHub-hosted read-only API execution received `403 Forbidden / Access Denied`. The workflow was changed to provide deterministic feedback without attempting to disguise or bypass hosted traffic:

- dependency installation;
- TypeScript, ESLint, and Prettier checks;
- 14 validator unit tests;
- default and cross-browser test discovery.

Discovery validates loading and configuration, not live behavior. Production-facing CI requires an approved runner or controlled environment.

## 8. Stopping point

The maintained suite stops where additional production traffic or abstraction would provide limited new confidence. Authentication, bidding, purchasing, broad device matrices, performance, security, and provider-owned contracts remain conditional future work rather than missing take-home requirements. See [future opportunities](future-opportunities.md).
