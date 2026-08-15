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

Additional scenarios are prioritized according to risk, confidence gained, execution cost, maintainability and production safety.

See [`docs/test-plan.md`](docs/test-plan.md) for the complete test strategy.

## Technology

- Playwright Test
- TypeScript
- Node.js
- Playwright APIRequestContext

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
│   ├── api/
│   │   └── lot-navigation.spec.ts
│   ├── e2e/
│   │   └── search-lot.spec.ts
│   └── integration/
│       └── train-search-bidding.spec.ts
│
├── docs/
│   ├── approach.md
│   ├── test-plan.md
│   └── adr/
│
├── playwright.config.ts
└── tsconfig.json
```

### Responsibilities

- `pages/` contains page-specific UI interactions and locators.
- `api/` contains reusable HTTP interaction logic and runtime contract validators.
- `tests/e2e/` contains user-facing end-to-end behavior.
- `tests/api/` contains direct API scenarios.
- `tests/integration/` contains scenarios that correlate UI behavior with backend API state.
- `docs/` contains the testing strategy, investigation notes and architectural decisions.

## Requirements

- Node.js
- npm

## Installation

Install project dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

## Type Checking

```bash
npx tsc --noEmit
```

## Running Tests

### Run the complete suite

```bash
npx playwright test
```

Local execution is configured to run browser-based tests in headed mode by default because Catawiki currently returns an `Access Denied` response during headless browser navigation.

Headless execution can still be enabled explicitly when needed:

```powershell
$env:HEADLESS="true"
npx playwright test
```

The suite does not attempt to bypass production anti-automation controls.

### Run the critical E2E journey

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

### Run smoke tests

```bash
npx playwright test --grep @smoke --project=chromium
```

### Run tests tagged as API

```bash
npx playwright test --grep @api --project=chromium
```

## Reporting and Diagnostics

The framework currently captures:

- HTML reports
- Screenshots on failure
- Video retained on failure
- Playwright trace on first retry
- Runtime diagnostic values where useful

Open the latest HTML report with:

```bash
npx playwright show-report
```

The goal is for failures to provide enough information to begin investigation without immediately reproducing them locally.

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

- [`docs/test-plan.md`](docs/test-plan.md) — planned, implemented and deferred coverage
- [`docs/approach.md`](docs/approach.md) — how the solution evolved during exploration and implementation
- [`docs/adr/`](docs/adr/) — architectural decisions and trade-offs

## Production Safety

The system under test is the real Catawiki production environment.

Automation is therefore intentionally limited to low-impact and non-destructive behavior.

The suite avoids:

- Bidding or purchasing
- Production data modification
- Favouriting/unfavouriting
- Account creation
- Load or stress testing
- Authentication probing
- Undocumented endpoint guessing
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

The API navigation scenario discovers a current lot dynamically and validates relationships between adjacent lot responses rather than fixed identifiers.

## API and Contract Testing

Network reconnaissance identified several read-only JSON endpoints naturally consumed by the Catawiki application.

A small `CatawikiApiClient` centralizes endpoint and request configuration while keeping behavioral expectations inside the tests.

Runtime schema validation is used to verify relevant API response structures.

Contract checks are intentionally separated from business assertions.

For example:

- `current_position` being an integer is a contract expectation.
- `next.current_position === current.current_position + 1` is a behavioral invariant.

Only fields relevant to the implemented scenarios are validated to avoid unnecessary coupling to the complete backend implementation.

## Known Limitations

### Headless browser execution

During development, headed Chromium successfully loaded the production application while headless navigation could receive an `Access Denied` response from the production edge layer.

The suite does not attempt to bypass this behavior.

### Dynamic production environment

Results, auction state and live values can change between requests.

Tests therefore prefer structural validation and cross-response invariants over exact-value assertions.

### Limited production permissions

Authenticated, destructive, performance and deeper backend scenarios would be more appropriate with access to a controlled staging environment and dedicated test data.

## Current Direction

The next planned areas include:

- Additional high-value negative coverage
- Automated accessibility checks
- Cross-browser execution
- CI/CD workflow design
- Failure artifact publishing
- Selected internationalization coverage

Implementation remains intentionally proportional to the assignment and available environment.