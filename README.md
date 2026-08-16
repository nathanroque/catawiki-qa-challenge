# Catawiki QA Challenge

QA automation solution for the Catawiki technical challenge, built with Playwright and TypeScript.

The project started with the required search-to-lot journey and was intentionally expanded using a risk-based testing strategy to demonstrate broader software quality thinking without introducing unnecessary complexity or unsafe production interactions.

## Current Scope

The implemented coverage currently includes:

- End-to-end validation of the required `Train` search journey
- Validation that the selected search result matches the opened lot
- Retrieval and validation of lot title, favourite count and current bid
- Negative search coverage for searches with no exact matches
- UI/API integration validation for the second `Train` search result
- Direct API validation of lot navigation consistency
- Runtime contract validation for selected API responses
- Automated accessibility regression checks for:
  - Landing page
  - Search results
  - Lot details
- Cross-browser smoke validation across Chromium, Firefox and WebKit
- TypeScript validation through GitHub Actions
- Internationalization validation for language selection and locale persistence across the critical journey

Additional scenarios are prioritized according to risk, confidence gained, execution cost, maintainability and production safety.

See [`docs/test-plan.md`](docs/test-plan.md) for the complete test strategy.

## Technology

- Playwright Test
- TypeScript
- Node.js
- Playwright `APIRequestContext`
- `@axe-core/playwright`
- GitHub Actions

## Project Structure

```text
.
├── api/
│   ├── CatawikiApiClient.ts
│   └── schemas/
│       ├── biddingState.schema.ts
│       └── lotNavigation.schema.ts
│
├── pages/
│   ├── SearchPage.ts
│   ├── SearchResultsPage.ts
│   └── LotPage.ts
│
├── tests/
│   ├── accessibility/
│   ├── api/
│   ├── e2e/
│   ├── integration/
│   └── i18n/
│
├── docs/
│   ├── approach.md
│   ├── findings.md
│   ├── test-plan.md
│   └── adr/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── playwright.config.ts
├── playwright.cross-browser.config.ts
├── package.json
└── tsconfig.json
```

### Responsibilities

- `pages/` contains page-specific UI interactions and locators.
- `api/` contains reusable HTTP interaction logic and runtime contract validators.
- `tests/e2e/` contains user-facing end-to-end behavior.
- `tests/api/` contains direct read-only API scenarios.
- `tests/integration/` contains scenarios that correlate UI behavior with backend API state.
- `tests/accessibility/` contains automated accessibility regression checks.
- `docs/` contains the test strategy, investigation findings and architectural decisions.
- `playwright.config.ts` defines the default Chromium execution.
- `playwright.cross-browser.config.ts` defines serialized smoke execution across Chromium, Firefox and WebKit.
- `tests/i18n/` contains internationalization and locale-persistence coverage.

## Requirements

- Node.js
- npm

## Installation

Install project dependencies:

```bash
npm ci
```

Install Playwright browsers:

```bash
npx playwright install
```

## Type Checking

```bash
npm run typecheck
```

## Running Tests

### Run the default suite

```bash
npm test
```

The default Playwright configuration runs the implemented suite in Chromium.

Browser-based tests run headed locally by default because headless navigation to the Catawiki production application may receive an `Access Denied` response from the production edge layer.

The suite does not attempt to bypass this production restriction.

### Run cross-browser smoke validation

```bash
npm run test:cross-browser
```

The cross-browser configuration reuses the critical `@smoke` journey across:

- Chromium
- Firefox
- WebKit

Cross-browser execution uses a dedicated Playwright configuration and a single worker.

During exploratory execution, each browser completed the critical journey successfully when executed independently. Concurrent multi-browser execution produced intermittent timing failures, while serialized execution completed successfully.

The single-worker constraint is therefore scoped specifically to cross-browser validation rather than reducing parallelism across the default suite.

### Run the critical E2E journey in Chromium

```bash
npx playwright test tests/e2e/search-lot.spec.ts --project=chromium
```

### Run API tests

```bash
npx playwright test tests/api --project=chromium
```

### Run UI/API integration tests

```bash
npx playwright test tests/integration --project=chromium
```

### Run accessibility tests

```bash
npx playwright test tests/accessibility --project=chromium
```

### Run internationalization tests

```bash
npx playwright test tests/i18n --project=chromium
```

### Run smoke tests in Chromium

```bash
npx playwright test --grep @smoke --project=chromium
```

### Run tests tagged as API

```bash
npx playwright test --grep @api --project=chromium
```

### Explicit headless execution

Headless execution can still be requested explicitly:

```powershell
$env:HEADLESS="true"
npm test
```

The production environment may reject this execution mode with `Access Denied`. The framework intentionally does not attempt to circumvent that behavior.

## Reporting and Diagnostics

The default test suite generates:

- HTML report: `playwright-report/`
- JUnit report: `test-results/junit.xml`

Cross-browser execution generates separate reports:

- HTML report: `playwright-report-cross-browser/`
- JUnit report: `test-results/cross-browser-junit.xml`

To open the reports locally:

```bash
npm run report
npm run report:cross-browser
```

The framework also captures:

- Screenshots on failure
- Video retained on failure
- Trace collection on retry
- Named test steps
- Runtime diagnostic values where useful

## Testing Strategy

The suite follows a risk-based and value-oriented strategy.

Tests are classified as:

- **P0** — Critical assignment coverage
- **P1** — High-value additional coverage
- **P2** — Stretch coverage
- **Experimental** — Useful techniques that should not act as primary test oracles
- **Deferred** — Valuable under different conditions but intentionally not implemented in the current environment

The project intentionally favors a smaller reliable suite over maximizing test count.

See:

- [`docs/test-plan.md`](docs/test-plan.md) — planned, implemented, candidate and deferred coverage
- [`docs/approach.md`](docs/approach.md) — how the solution evolved during exploration and implementation
- [`docs/findings.md`](docs/findings.md) — notable observations discovered during testing
- [`docs/adr/`](docs/adr/) — architectural decisions and trade-offs

## Production Safety

The system under test is the real Catawiki production environment.

Automation is therefore intentionally limited to low-impact and non-destructive behavior.

The suite avoids:

- Bidding or purchasing
- Production data modification
- Favouriting or unfavouriting
- Account creation
- Load or stress testing
- Authentication or authorization probing
- Arbitrary internal endpoint probing
- Circumventing production security or anti-automation controls

Read-only APIs naturally used by unauthenticated customer flows may be validated when they provide meaningful and safe coverage.

## Dynamic Production Data

Auction data changes continuously.

The tests therefore avoid hard-coding volatile values such as:

- Lot IDs
- Lot titles
- Bid amounts
- Favourite counts
- Auction positions

Instead, runtime values are discovered and used to validate relationships and invariants.

For example, the critical E2E scenario captures the selected search result and verifies that the corresponding lot is the one opened after navigation.

The API navigation scenario discovers a current lot dynamically and validates relationships between adjacent lot responses rather than relying on fixed identifiers.

## API and Contract Testing

Network reconnaissance identified several read-only JSON endpoints naturally consumed by the Catawiki application.

A small `CatawikiApiClient` centralizes endpoint and request configuration while keeping behavioral expectations inside the tests.

Runtime schema validation is used to verify the relevant API response structures.

Contract checks are intentionally separated from business assertions.

For example:

- `current_position` being an integer is a contract expectation.
- `next.current_position === current.current_position + 1` is a behavioral invariant.

Only fields relevant to the implemented scenarios are validated to avoid unnecessary coupling to the complete backend implementation.

## Accessibility Testing

Automated accessibility regression checks use `@axe-core/playwright`.

The implemented coverage includes:

- Landing page
- Search results
- Lot details

Initial scans identified existing high-severity axe findings in the public production application.

Because this project does not control the production code, permanently failing on every existing finding would reduce the usefulness of the automation as a regression signal.

The accessibility tests therefore use explicit page-specific known-issue baselines.

The baseline:

- Keeps existing findings visible
- Does not classify those findings as acceptable
- Fails when a new serious or critical axe rule appears outside the known baseline

Baselines are maintained by axe violation rule ID rather than exact affected-node count because the production application contains dynamic and conditionally rendered content.

Automated axe checks are treated as accessibility regression signals and do not represent complete WCAG validation or replace manual accessibility evaluation.

## Cross-Browser Strategy

The complete suite is intentionally not multiplied across every browser.

The default Playwright configuration executes the full implemented suite using Chromium.

A dedicated cross-browser configuration reuses only the highest-value `@smoke` journey across:

```text
Chromium
Firefox
WebKit
```

This provides browser compatibility coverage without unnecessarily multiplying API, integration, negative and accessibility scenarios across every browser.

Cross-browser smoke execution uses one worker because concurrent multi-browser execution showed intermittent timing instability against the live production environment.

The same browser scenarios completed successfully when executed independently and when the cross-browser run was serialized.

## Internationalization Testing

The implemented internationalization scenario validates that a selected locale remains active throughout the critical search-to-lot journey.

The test switches the application from English to Dutch and validates:

- Locale-specific URL state
- Stable translated application UI
- Locale persistence after search
- Locale persistence after opening a lot

Dynamic lot content is not used as a translation oracle.

Exploratory testing showed that the same `Train` query can return different result ordering and lot content depending on the active locale, so the scenario discovers the selected lot dynamically within the current language context.

The I18N scenario uses a scoped 45-second timeout because repeated parallel full-suite execution showed that its additional locale transition could occasionally exceed the default 30-second budget.

## Reliability Strategy

Reliability problems discovered during repeated execution are addressed as close as possible to their observed cause rather than through broad retries, arbitrary waits or global timeout increases.

Examples include:

- Accessibility scans are serialized within their own scope and use a dedicated timeout because full-page axe analysis demonstrated higher execution cost.
- Cookie consent is handled through the visible user-facing control rather than forced clicks or hard-coded internal consent state.
- Late Usercentrics initialization is handled again before interactions that may be blocked by the overlay.
- Mandatory API failures include HTTP status and response information for easier diagnosis.
- Cross-browser smoke execution uses a single worker after concurrent browser execution demonstrated intermittent timing instability.

Local execution uses no automatic retries.

A retry may be enabled in CI for diagnostic purposes, but retries are not treated as a substitute for investigating unreliable behavior.

## CI/CD

GitHub Actions currently performs deterministic repository validation:

```text
Dependency installation
        ↓
TypeScript type check
```

An initial GitHub-hosted workflow also attempted to execute read-only production API coverage.

Repository setup, dependency installation and TypeScript validation completed successfully, but the production API request received `403 Forbidden / Access Denied` from the Catawiki production edge layer.

Production-facing API and browser scenarios are therefore intentionally excluded from the current GitHub-hosted workflow.

The project does not attempt to bypass this restriction through altered headers, browser spoofing, arbitrary retries or other anti-automation workarounds.

With an approved execution environment that can access the production application normally, the CI strategy could expand to include:

- High-value API checks
- Critical Chromium smoke coverage
- Negative search coverage
- Accessibility regression reporting
- Scheduled cross-browser smoke validation

## Known Limitations

### Headless browser execution

During development, headed browser execution successfully loaded the production application while headless Chromium navigation could receive an `Access Denied` response from the production edge layer.

The suite does not attempt to bypass this behavior.

### GitHub-hosted production access

Production requests from the current GitHub-hosted environment may receive `403 Forbidden / Access Denied`.

For this reason, the current hosted workflow performs deterministic static validation rather than production-facing test execution.

### Cross-browser concurrency

The critical journey works in Chromium, Firefox and WebKit.

Concurrent multi-browser execution showed intermittent timing instability against the live production application, while isolated and serialized execution completed successfully.

Cross-browser smoke validation is therefore intentionally configured with a single worker.

### Dynamic production environment

Search results, auction state and live values can change between requests.

Tests therefore prefer structural validation and cross-response invariants over exact-value assertions.

### Limited production permissions

Authenticated, destructive, performance and deeper backend scenarios would be more appropriate with access to a controlled staging environment and dedicated test data.

## Further Opportunities

With more time or access to a controlled internal environment, useful extensions could include:

- Deterministic visual regression coverage
- Authenticated user journeys with dedicated test accounts
- Controlled state-changing API scenarios
- Broader CI execution in an approved environment
- Performance testing against a non-production system with explicit authorization

These areas remain intentionally secondary to the implemented P0 and P1 coverage.