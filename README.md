# Catawiki QA Automation Challenge

Playwright and TypeScript solution for the Catawiki QA Automation Engineer take-home assignment.

The canonical journey searches for `Train`, opens the second result, verifies the selected lot, and reports its title, favourite count, bidding-state label, and displayed euro amount. `Train` remains the default assignment keyword; `SEARCH_KEYWORD` provides an optional local exploratory override.

The suite runs against the public Catawiki production environment. It is intentionally read-only and does not bid, purchase, register accounts, change favourites, probe authentication, perform load testing, or bypass production controls.

## Current coverage

- Critical search-to-second-lot journey with runtime title and lot-ID continuity
- Supported bidding states: `Current bid` and `Starting bid`, reported without conflating them
- Negative search fallback behavior
- UI/API consistency for lot identity, favourite count, and displayed euro bid amount
- Read-only lot-navigation API relationships
- Focused runtime response validation with deterministic validator unit tests
- Accessibility regression signals for landing, search-results, and lot pages
- Critical smoke journey on Chromium, Firefox, and Playwright WebKit
- English-to-Dutch locale persistence
- Normal search-result view and preference persistence
- Representative mobile coverage with the Playwright `iPhone 13` profile

The [test plan](docs/test-plan.md) is the source of truth for scenario priority and implementation status.

## Project structure

```text
pages/                 Small page-specific UI abstractions
api/                   Read-only request client and runtime validators
support/               Consent handling and shared search keyword
tests/e2e/             Customer-facing journeys
tests/api/             Direct read-only API behavior
tests/integration/     UI/API consistency
tests/unit/            Deterministic validator tests
tests/accessibility/   Axe regression signals and known baselines
tests/i18n/            Locale persistence
docs/                  Strategy, evidence, decisions, and future work
```

For the documentation reading order and topic ownership, see the [documentation guide](docs/README.md).

## Requirements and installation

- Node.js
- npm

```bash
npm ci
npx playwright install
```

## Quality checks

```bash
npm run quality
```

This runs TypeScript checking, ESLint, Prettier verification, and 14 deterministic runtime-validator tests.

Individual commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
```

## Running the suite

```bash
# Full implemented suite in Chromium
npm test

# Critical smoke journey in Chromium, Firefox, and WebKit
npm run test:cross-browser

# Focused categories
npx playwright test tests/api --project=chromium
npx playwright test tests/integration --project=chromium
npx playwright test tests/accessibility --project=chromium
npx playwright test tests/i18n --project=chromium
npx playwright test tests/e2e/mobile-search.spec.ts --project=chromium

# Tag-based execution; quotes are PowerShell-safe
npx playwright test --grep '@smoke' --project=chromium
npx playwright test --grep '@api' --project=chromium
```

Browser tests run headed locally unless `HEADLESS=true` is set. Headless production access can receive `Access Denied`; the project does not attempt to circumvent that behavior.

### Optional search override

`support/test-data.ts` defaults to the assignment keyword `Train`. For bounded local exploration:

```powershell
$env:SEARCH_KEYWORD="Car"
npm test
```

```bash
SEARCH_KEYWORD=Car npm test
```

The override is not a promise that every query satisfies the canonical journey's live-data preconditions, such as at least two results and a supported bidding state.

## Execution model

| Mode                    | Browsers                  |                       Workers |       Test timeout | Retries |
| ----------------------- | ------------------------- | ----------------------------: | -----------------: | ------: |
| Default                 | Chromium                  | 2 locally, 1 when `CI` is set | Playwright default |       0 |
| Cross-browser smoke     | Chromium, Firefox, WebKit |                             1 |         45 seconds |       0 |
| Accessibility scenarios | Chromium                  |              Inherits default |         60 seconds |       0 |
| I18N scenario           | Chromium                  |              Inherits default |         45 seconds |       0 |

The default configuration uses `fullyParallel: false`. The cross-browser configuration is intentionally serialized after concurrent live execution showed timing instability. WebKit coverage is not presented as execution against Safari on macOS.

See the [approach](docs/approach.md) for the evidence behind these choices.

## Reports and diagnostics

The default suite writes:

- `playwright-report/`
- `test-results/junit.xml`

Cross-browser execution writes:

- `playwright-report-cross-browser/`
- `test-results/cross-browser-junit.xml`

```bash
npm run report
npm run report:cross-browser
```

The configuration retains screenshots and video on failure. Trace collection is configured for a first retry if retries are explicitly enabled for a future controlled execution; retries are currently disabled.

## Hosted CI

GitHub Actions currently runs:

1. `npm ci`
2. `npm run quality`
3. Default Playwright test discovery
4. Cross-browser Playwright test discovery

It does **not** run production-facing browser or API scenarios. A previous hosted read-only request received `403 Forbidden / Access Denied` from the production edge layer. An approved runner or controlled environment is required before functional CI execution is enabled.

## Key constraints

- Production auction data is dynamic; tests discover runtime values and validate identity or relationships.
- `Current bid` and `Starting bid` are distinct UI states. The suite reports the observed label and validates its associated amount.
- Accessibility automation is a rule-category regression signal, not proof of WCAG compliance.
- API validators cover fields consumed by the suite, not the complete provider contract.
- One mobile profile and Playwright WebKit are bounded compatibility signals, not complete device or Safari coverage.

Observed production behavior is recorded in [findings](docs/findings.md). Deliberately deferred improvements are in [future opportunities](docs/future-opportunities.md).
