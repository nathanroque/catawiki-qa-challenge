# Catawiki QA Automation Skill

## Purpose

This skill defines how an AI coding agent should work within the Catawiki QA automation repository.

The goal is to help agents make changes that remain consistent with the existing architecture, testing strategy, production constraints, and documentation decisions.

Agents should optimize for:

- Reliability
- Maintainability
- Clear test intent
- Production safety
- Proportional engineering
- Consistency with the existing framework
- Useful failure diagnostics

The repository is intentionally small and focused.

Agents should not introduce additional abstractions, dependencies, test layers, or infrastructure unless they provide clear value for the current task.

## Repository Context

This project is a Playwright and TypeScript QA automation solution built against the public Catawiki production environment.

The suite currently contains:

- End-to-end browser coverage
- Negative search coverage
- Read-only API testing
- UI/API integration testing
- Runtime contract validation
- Accessibility regression coverage
- Cross-browser smoke coverage
- Internationalization coverage
- HTML and JUnit test reporting

The implementation follows a risk-based testing strategy rather than attempting to maximize the number of automated tests.

The complete testing strategy and scenario prioritization are documented in:

- `docs/test-plan.md`
- `docs/approach.md`
- `docs/findings.md`
- `docs/adr/`

Agents should review the relevant documentation before making changes that affect test strategy, architecture, execution behavior, or production interaction.

## Production Safety

The system under test is a real production environment.

All automated interaction must remain safe, read-only, and representative of normal public user behavior.

Agents must not introduce tests or utilities that:

- Place bids
- Purchase items
- Create or modify favourites
- Create accounts
- Modify user or auction state
- Attempt authentication bypass
- Circumvent anti-automation controls
- Spoof browser or network behavior to bypass production restrictions
- Perform security fuzzing or injection testing
- Perform load, stress, or volume testing
- Generate aggressive or unnecessary request traffic
- Collect sensitive user data
- Probe undocumented internal systems without a clear testing need

If production restrictions prevent an execution path from working, the restriction must be documented rather than bypassed.

A technically possible test is not automatically an appropriate test for this repository.

## Repository Architecture

The repository is organized by responsibility rather than by feature duplication.

Agents should preserve this separation when adding or modifying functionality.

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
├── support/
│   └── cookie-consent.ts
│
├── tests/
│   ├── accessibility/
│   │   ├── accessibility.spec.ts
│   │   └── known-violations.ts
│   ├── api/
│   │   └── lot-navigation.spec.ts
│   ├── e2e/
│   │   └── search-lot.spec.ts
│   ├── i18n/
│   │   └── language-persistence.spec.ts
│   └── integration/
│       └── train-search-bidding.spec.ts
│
├── docs/
│   ├── adr/
│   ├── approach.md
│   ├── findings.md
│   └── test-plan.md
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

## File Responsibilities

### `tests/`

Test files should describe observable behavior and validation intent.

Tests should:

- Use Playwright `test.step()` when it improves report readability
- Prefer meaningful behavioral assertions over implementation-detail checks
- Reuse page objects, API clients, schemas, and support utilities where appropriate
- Discover volatile production data at runtime
- Avoid duplicating framework logic inside individual specs

Test directories have distinct responsibilities:

- `tests/e2e/` contains user-facing browser journeys
- `tests/api/` contains direct read-only API scenarios
- `tests/integration/` correlates browser behavior with backend API state
- `tests/accessibility/` contains automated accessibility regression checks
- `tests/i18n/` contains locale and internationalization behavior

Do not create a new test category only to demonstrate another testing technique. A new layer or directory should exist because it covers a meaningfully different risk.

### `pages/`

Page objects encapsulate reusable UI interactions and page-specific locators.

Current responsibilities are:

- `SearchPage.ts` — landing-page navigation, search interaction, and language selection
- `SearchResultsPage.ts` — search-result discovery, lot identity, and result navigation
- `LotPage.ts` — lot-detail information and interactions required by current tests

Agents should prefer extending an existing page object when an interaction clearly belongs to that page.

Do not introduce base-page hierarchies, component abstractions, or additional page objects unless repeated usage demonstrates a real maintenance benefit.

Page objects should not normally own test assertions.

### `api/`

`CatawikiApiClient.ts` contains reusable interaction with the public read-only APIs used by the suite.

API requests should remain explicit about failure conditions and provide useful diagnostics when mandatory requests fail.

The `api/schemas/` directory contains runtime contract validators for API responses.

Schema validation should focus on structural requirements and useful business invariants rather than exact values from live production data.

### `support/`

The `support/` directory contains small utilities that solve cross-cutting test-environment concerns.

For example, `cookie-consent.ts` handles the public Usercentrics consent flow when it blocks normal interaction.

Support utilities should remain focused and understandable.

Do not use support code to bypass real application behavior or production restrictions.

### `docs/`

Documentation is part of the implementation and should remain synchronized with meaningful changes.

- `docs/test-plan.md` describes planned, implemented, experimental, and deferred test coverage
- `docs/approach.md` explains implementation strategy and engineering reasoning
- `docs/findings.md` records relevant behavior discovered during implementation and execution
- `docs/adr/` records architectural decisions that have lasting consequences for the repository

Not every code change requires an ADR.

Create or update an ADR only when the change represents a durable architectural or strategic decision rather than a local implementation detail.

### Playwright configuration

`playwright.config.ts` is the default execution configuration.

It currently represents the normal Chromium-based suite.

`playwright.cross-browser.config.ts` extends the default configuration for the critical smoke journey across Chromium, Firefox, and WebKit.

Agents should not duplicate test implementations to achieve browser coverage.

Browser differences should normally be handled through Playwright projects and configuration.

### `.github/workflows/ci.yml`

The current GitHub-hosted workflow performs deterministic static validation only.

Production-facing browser and API execution is intentionally excluded because the production edge layer has rejected automated traffic from the hosted environment.

Agents must not re-enable production-facing CI execution by attempting to bypass those restrictions.

## Development and Test Conventions

Agents should preserve the existing reliability and readability conventions when adding or modifying tests.

### Locator strategy

Prefer resilient, user-facing locators.

Recommended priority:

1. Accessible roles and names
2. Stable labels or text owned by the application
3. Existing page-object locators
4. Stable structural relationships when a semantic locator is not sufficient

Avoid:

- Dynamic element IDs
- Generated CSS classes
- Deep CSS selectors
- XPath when a semantic locator is available
- Locators based on volatile production values

If a locator becomes ambiguous, prefer narrowing its scope to a meaningful container rather than selecting an arbitrary element with `.first()`.

### Assertions

Prefer Playwright web-first assertions for UI state.

Examples:

```ts
await expect(locator).toBeVisible();
await expect(page).toHaveURL(/\/en\/s\?/);
await expect(locator).toHaveText(expectedValue);
```

Avoid replacing web-first assertions with immediate state checks such as:

```ts
expect(await locator.count()).toBeGreaterThan(0);
```

when the assertion depends on asynchronously rendered UI.

Direct value assertions remain appropriate for already retrieved values and API data.

For example:

```ts
expect(lotId).toBeGreaterThan(0);
expect(favouriteCount).toBeGreaterThanOrEqual(0);
```

### Waiting and synchronization

Do not introduce arbitrary sleeps such as:

```ts
await page.waitForTimeout(5000);
```

Tests should synchronize through observable application state using:

- Playwright locator auto-waiting
- Web-first assertions
- URL assertions
- Explicit response or navigation state when required

If a test is unreliable, investigate the actual waiting condition before increasing timeouts or adding retries.

### Timeouts

The default timeout should remain the normal execution budget for most scenarios.

A larger timeout may be scoped to a scenario or test group when repeated execution demonstrates a genuine higher execution cost.

Current examples include:

- Accessibility scans using a dedicated execution budget
- Internationalization coverage using a scoped timeout because of the additional locale transition

Do not increase the global timeout to solve a problem isolated to one test category.

Repeated timeout increases should not be used as a substitute for identifying a synchronization problem.

### Retries

Retries must not be used to hide flaky tests.

Local execution intentionally does not depend on retries for passing behavior.

When a failure is reproducible, agents should investigate the underlying cause before changing retry configuration.

A CI retry may provide additional diagnostic information, but a test that passes only because it is retried should still be treated as unreliable.

### Dynamic production data

Production values are volatile.

Examples include:

- Lot IDs
- Lot titles
- Current bids
- Favourite counts
- Auction state
- Search-result ordering
- Number of search results

Tests should discover these values at runtime and validate relationships, structure, or invariants.

For example, the critical journey captures the identity of the selected search result before navigation and verifies that the same lot was opened.

Do not hard-code a temporary production lot only to make a test deterministic.

### Locale-dependent data

Search results may differ depending on the active locale.

Internationalization tests must not assume that the same query returns the same lot identity or result ordering across languages.

Locale assertions should focus on deterministic application-owned signals such as:

- Locale-specific URL state
- Stable translated interface text
- Active language selection
- Locale persistence across navigation

Seller-provided content and dynamic lot titles should not be used as translation oracles.

### API testing

API tests must remain read-only.

Prefer validating:

- HTTP success behavior
- Required response structure
- Identifier validity
- Relationships between returned entities
- Business invariants
- Timestamp ordering
- Non-negative counts where applicable

Avoid assertions against exact live values unless the value was discovered during the same scenario and is being used for consistency validation.

Mandatory API failures should provide useful diagnostics, including relevant HTTP status information and response content where safe and appropriate.

Do not add automatic retries around API failures merely to make intermittent HTTP responses disappear.

### Accessibility testing

Accessibility automation is treated as regression signal, not proof of complete WCAG compliance.

Existing known production findings are handled as a baseline by rule ID rather than exact affected-node count.

Agents should not:

- Remove a known rule from the baseline simply because it did not appear in one execution
- Add new findings to the baseline without confirming that they represent existing production behavior
- Describe a passing automated axe scan as proof that the page is fully accessible

Manual accessibility analysis remains a separate activity.

### Cross-browser testing

The critical smoke journey is reused across Chromium, Firefox, and WebKit through Playwright projects.

Do not duplicate the smoke test into browser-specific spec files.

The cross-browser configuration intentionally runs the smoke coverage serially because concurrent multi-browser execution demonstrated timing instability against the production environment.

Do not remove this execution constraint solely to reduce runtime without validating reliability through repeated execution.

### Reporting

The default suite generates:

```text
playwright-report/
test-results/junit.xml
```

Cross-browser execution generates:

```text
playwright-report-cross-browser/
test-results/cross-browser-junit.xml
```

Generated reports should remain untracked.

Tests should use meaningful `test.step()` boundaries and diagnostic output when those improve failure investigation.

Diagnostic logging should provide useful runtime context without dumping excessive production data.

## Official Commands and Validation Workflow

Agents should use the repository's existing npm scripts and Playwright configurations rather than inventing alternative execution commands without a clear reason.

### Type checking

Run TypeScript validation with:

```bash
npm run typecheck
```

This should be used after code changes that affect TypeScript source, test files, Playwright configuration, API clients, schemas, or support utilities.

### Default test suite

Run the normal Chromium-based suite with:

```bash
npm test
```

This is the primary local validation command for browser, API, integration, accessibility, and internationalization coverage included in the default configuration.

### Cross-browser smoke validation

Run the critical smoke journey across Chromium, Firefox, and WebKit with:

```bash
npm run test:cross-browser
```

This uses `playwright.cross-browser.config.ts`.

The cross-browser suite intentionally executes with a single worker.

### Accessibility tests

Run accessibility coverage with:

```bash
npx playwright test tests/accessibility --project=chromium
```

Accessibility tests have their own execution characteristics and should not be used as a reason to change global suite behavior unless repeated evidence supports it.

### Internationalization tests

Run internationalization coverage with:

```bash
npx playwright test tests/i18n --project=chromium
```

### API tests

Run direct API coverage with:

```bash
npx playwright test tests/api --project=chromium
```

### UI/API integration tests

Run integration coverage with:

```bash
npx playwright test tests/integration --project=chromium
```

### Critical smoke test

Run the Chromium smoke journey with:

```bash
npx playwright test --grep @smoke --project=chromium
```

### Test discovery

When changing configuration, tags, test locations, or execution scripts, validate test discovery without executing production-facing scenarios:

```bash
npm test -- --list
npm run test:cross-browser -- --list
```

This is especially useful for CI-safe static validation.

### Reports

The default suite generates an HTML report and JUnit output.

Open the default HTML report with:

```bash
npm run report
```

Open the cross-browser HTML report with:

```bash
npm run report:cross-browser
```

Report output is generated locally and should not be committed to the repository.

### Validation after a focused change

Agents should begin with the smallest command that validates the affected area.

For example:

```text
Change to API schema
→ npm run typecheck
→ run affected API test

Change to I18N scenario
→ npm run typecheck
→ run tests/i18n

Change to shared search behavior
→ npm run typecheck
→ run affected scenario
→ npm test

Change to cross-browser configuration
→ npm run typecheck
→ npm run test:cross-browser
```

Do not repeatedly execute the entire production-facing suite when a smaller validation command can provide the required feedback.

### Validation before completion

For changes that can affect shared test behavior, the normal final local validation is:

```bash
npm run typecheck
npm test
npm run test:cross-browser
```

Use judgment when the change does not affect browser execution.

Documentation-only changes do not require unnecessary production-facing test traffic.

### Git validation

Before committing meaningful repository changes, agents should check:

```bash
git status
git diff --check
git diff --stat
```

`git diff --check` should complete without whitespace errors.

Generated test results and reports must not appear as tracked changes.

### Failure investigation

When a test fails:

1. Read the exact Playwright error.
2. Identify the failing test step or assertion.
3. Inspect the resulting page state, response data, trace, screenshot, or video when available.
4. Determine whether the failure is caused by:
   - application behavior;
   - test synchronization;
   - dynamic production data;
   - an environmental restriction;
   - a contract change;
   - a locator or assertion problem.
5. Apply the smallest change that addresses the demonstrated cause.
6. Re-run the smallest relevant test scope.
7. Use repeated execution when validating a reliability fix.

Do not begin by:

- Increasing the global timeout
- Adding arbitrary waits
- Adding retries
- Forcing blocked clicks
- Hard-coding currently observed production data
- Bypassing production restrictions

Reliability changes should be based on observed failure evidence rather than speculation.

## Change Decision Process

Agents should make changes according to demonstrated risk and value rather than test count or technical novelty.

Before adding a new automated scenario, determine:

1. What quality risk does this scenario cover?
2. Is that risk already covered by an existing test?
3. Does the new scenario provide meaningfully different confidence?
4. Is the test appropriate against the current production environment?
5. Is the expected maintenance cost proportional to its value?
6. Can the same confidence be obtained through a cheaper or safer test layer?
7. Does the scenario belong in the current scope, or should it be documented as a future opportunity?

A technically possible test should not be implemented only to increase suite size or demonstrate another tool.

### Coverage priorities

The repository uses the following prioritization model:

- **P0** — Critical behavior required for the core assignment
- **P1** — High-value additional confidence
- **P2** — Useful stretch coverage
- **Experimental** — Interesting techniques that should not act as primary test oracles
- **Deferred** — Valuable under different conditions but intentionally not implemented in the current environment

When adding or changing coverage, agents should preserve this risk-based model.

The test plan may contain more scenarios than are implemented.

That is intentional.

### Selecting the test layer

Choose the test layer based on the risk being validated rather than trying to maintain a fixed number of tests at each layer.

#### Use E2E when

The risk depends on observable user behavior across multiple application components.

Examples include:

- Search-to-lot navigation
- Locale persistence through navigation
- User-visible fallback behavior
- Critical cross-browser journeys

#### Use direct API testing when

The risk concerns a public read-only backend contract or invariant that can be validated more directly without a browser.

Examples include:

- Required response structure
- Navigation relationships
- Identifier consistency
- Timestamp ordering

Do not represent a browser-driven workflow as a pure API test when the application does not expose an appropriate API contract for that behavior.

#### Use UI/API integration testing when

The useful risk lies in consistency between browser state and backend state.

For example:

```text
UI discovers a production lot
        ↓
API retrieves bidding state for that lot
        ↓
test validates consistency between the two
```

This is preferable to hard-coding a production identifier.

#### Use accessibility testing when

The goal is to detect meaningful automated accessibility regressions in application-owned UI.

Automated accessibility checks should remain a signal rather than a claim of complete accessibility compliance.

#### Use cross-browser testing when

The same high-value behavior needs compatibility confidence across browser engines.

Prefer reusing an existing test through Playwright projects rather than duplicating scenario implementations.

#### Use internationalization testing when

The risk concerns locale selection, translated application-owned UI, or locale persistence.

Do not use dynamic seller or lot content as a primary language oracle.

### Avoid duplicate confidence

Minor input or navigation variations do not automatically justify separate tests.

For example, if the critical journey already proves that a dynamically discovered search result can be opened successfully, adding equivalent tests that only select the third, fourth, or fifth result would provide limited additional confidence.

Similarly, testing several casing variations of the same successful query is generally lower value than testing a meaningfully different behavior such as a no-exact-results state.

Prefer distinct risks over superficial input permutations.

## Adding New Coverage

When a new scenario is justified, follow this sequence.

### 1. Define the behavior first

Describe the intended scenario in behavioral terms before implementing it.

Gherkin-style `Given / When / Then` may be used in the test plan for readability.

This does not mean introducing Cucumber or another BDD execution framework.

### 2. Classify the scenario

Determine:

- Test layer
- Priority
- Expected execution context
- Production safety
- CI suitability
- Whether the scenario is implemented, experimental, candidate, or deferred

### 3. Explore the application

For production-facing behavior, manually inspect the flow before automating it.

Identify:

- Stable application-owned signals
- Dynamic data
- Relevant network behavior
- Possible environmental restrictions
- User-facing states that may interfere with automation

Do not design the automation around assumptions that have not been observed.

### 4. Reuse existing architecture

Before creating new files or abstractions, check whether the behavior belongs in:

- An existing page object
- `CatawikiApiClient`
- An existing runtime schema
- A focused support utility
- An existing test category

Prefer extending the current design over introducing parallel abstractions.

### 5. Implement the smallest valuable scenario

The test should prove the intended behavior without accumulating unrelated assertions.

Additional assertions should exist because they improve confidence in the same risk, not because values happen to be available.

### 6. Validate reliability

Run the focused scenario first.

If it passes, expand validation according to the scope of the change.

For reliability-sensitive changes, repeated execution may be used to establish whether a failure is reproducible and whether a mitigation is effective.

Do not classify a test as stable based only on one successful run after a known intermittent failure.

### 7. Update documentation

When a scenario moves from planned or candidate status to implemented, update the relevant documentation.

At minimum, consider whether changes are required in:

- `docs/test-plan.md`
- `docs/approach.md`
- `docs/findings.md`
- `README.md`

Documentation should describe what was actually implemented, not the earlier intended design.

### 8. Stop when the value is delivered

Do not continue refactoring or expanding a scenario only because additional improvements are possible.

When the implementation is reliable, understandable, proportionate, and provides the intended confidence, further improvements can be recorded as future opportunities instead.

## Documentation and ADR Rules

Documentation is part of the repository's engineering output.

Agents should keep documentation aligned with the actual implementation and avoid leaving stale descriptions of behavior, coverage, execution, or architecture.

When updating documentation, prefer editing the existing relevant section rather than appending a second section that describes the same topic.

### Test plan updates

Update `docs/test-plan.md` when:

- A planned or candidate scenario becomes implemented
- A scenario changes priority or execution target
- A scenario is intentionally deferred or rejected
- The implemented behavior differs materially from the original test strategy
- A newly discovered constraint changes how a scenario should be tested

The test plan should distinguish clearly between:

- Implemented
- Candidate
- Experimental
- Deferred
- Rejected behavior

Do not mark coverage as implemented before the corresponding automated scenario exists and has been validated.

### Approach updates

Update `docs/approach.md` when a change introduces or refines meaningful engineering reasoning.

Examples include:

- Reliability strategies
- Execution-model decisions
- Test-layer selection
- Production-environment constraints
- Runtime-data strategies
- CI/CD design decisions
- Cross-browser execution behavior
- Internationalization strategy

The approach document should explain why the implementation works the way it does, not merely repeat source code.

### Findings updates

Update `docs/findings.md` when implementation or exploration reveals meaningful behavior about:

- The production application
- Browser execution
- API behavior
- Accessibility
- Internationalization
- Dynamic data
- CI restrictions
- Reliability characteristics

A finding should distinguish observation from interpretation.

Do not present an inferred root cause as proven unless there is evidence supporting it.

For example, if parallel execution correlates with a timeout, document the observed timing instability rather than claiming resource contention unless resource contention was actually demonstrated.

### README updates

Update `README.md` when a change affects how another engineer would:

- Understand current coverage
- Navigate the repository
- Install dependencies
- Run tests
- Run a specific test category
- Generate or open reports
- Understand execution constraints
- Understand the currently implemented capabilities

The README should describe the current repository rather than future architecture.

Detailed rationale belongs in the supporting documentation when it would make the README unnecessarily long.

## ADR Usage

Architectural Decision Records are reserved for decisions with durable impact on how the repository is designed or operated.

An ADR may be appropriate when a decision affects:

- Core testing framework selection
- Test-layer architecture
- Production safety policy
- Shared abstraction strategy
- Risk-based planning model
- Cross-browser execution architecture
- Other decisions that future contributors could reasonably reconsider without knowing the original context

An ADR is usually not required for:

- Adding an individual test
- Updating a locator
- Adding a local timeout to a demonstrated expensive scenario
- Adding an npm script
- Updating report output paths
- Small refactors
- Documentation corrections

Before creating a new ADR:

1. Check the existing ADRs.
2. Determine whether the decision is already documented.
3. Update an existing ADR when the new change refines the same decision.
4. Create a new ADR only when the decision is materially distinct.

Do not create ADRs to make the repository appear more architecturally sophisticated.

## Change Completion Checklist

Before considering a task complete, agents should verify the items relevant to the change.

### Implementation

- The change addresses the intended risk or requirement.
- Existing architecture was reused where appropriate.
- No unnecessary abstraction or dependency was introduced.
- Production interaction remains within the repository safety constraints.
- Dynamic production values are not unnecessarily hard-coded.
- Locators and assertions follow the existing reliability conventions.

### Validation

- TypeScript validation passes when applicable.
- The smallest relevant test scope passes.
- Broader suite validation was performed when shared behavior changed.
- Cross-browser validation was performed when browser-sensitive behavior or shared smoke functionality changed.
- Reliability fixes were validated through repeated execution when appropriate.
- Generated reports and test artifacts remain untracked.

### Documentation

- The test plan reflects the actual implementation status.
- Engineering reasoning is updated when materially changed.
- Relevant findings are recorded.
- README commands and capabilities remain accurate.
- ADRs were updated or created only when warranted.

### Git hygiene

Agents should not create, delete, reset, rebase, force-push, or move branches unless the current task requires it and the impact is understood.

Before committing:

```bash
git status
git diff --check
git diff --stat
```

Confirm that:

- Only intended files changed
- No generated reports are staged
- No temporary exploration files are staged
- No secrets, credentials, session state, or sensitive data are present
- Whitespace validation passes

### Final review

Before presenting the change as finished, ask:

> Does this change provide enough confidence for its intended purpose without introducing more complexity than the problem requires?

If the answer is yes, stop.

Potential improvements that are useful but not necessary for the current task should be documented rather than automatically implemented.

## Known Constraints and Established Decisions

The repository contains several decisions that were reached through direct investigation and repeated execution.

Agents should understand these constraints before attempting to change them.

Do not reopen or reverse an established decision without new evidence that materially changes the situation.

### Headless production access

Local headed Chromium can execute the public Catawiki journey successfully.

Headless browser execution can receive `Access Denied` responses from the production edge layer.

The repository does not attempt to bypass this restriction through:

- Header spoofing
- Browser fingerprint manipulation
- Anti-bot circumvention
- Session reuse intended to evade detection
- Other techniques designed to make automation appear like unrestricted customer traffic

If this behavior changes naturally, it may be re-evaluated.

### GitHub-hosted production execution

GitHub-hosted runners have received `403 Forbidden / Access Denied` responses from production-facing requests.

The current CI workflow therefore performs static validation rather than executing the production-facing test suite.

Do not re-enable production execution in hosted CI by introducing bypass mechanisms.

A future approved or self-hosted execution environment may justify revisiting this limitation.

### Cookie consent

Fresh browser contexts may display a Usercentrics consent interface that blocks normal page interaction.

The suite handles this through the public user-facing rejection flow when required.

Preloading the underlying Usercentrics state was investigated but intentionally rejected because the relevant stored state is opaque and tied to third-party configuration.

Do not hard-code internal consent-state values solely to avoid interacting with the public consent UI.

The consent utility may be invoked close to interactions that can be blocked because the overlay can initialize after initial page navigation.

### Cross-browser execution

The critical smoke journey is executed across:

```text
Chromium
Firefox
WebKit
```

The same smoke test is reused through Playwright projects.

Repeated concurrent multi-browser execution demonstrated timing instability against the production environment.

The cross-browser configuration therefore uses:

```ts
workers: 1
```

This is an intentional reliability constraint.

Do not increase cross-browser concurrency without repeated validation showing that the production-facing journey remains reliable.

WebKit coverage represents Playwright's WebKit engine configuration and should not be described as execution against a real Safari installation on macOS.

### Accessibility baseline

The production application contains known automated accessibility findings.

The accessibility suite therefore validates against a confirmed baseline of known high-severity rule IDs rather than requiring zero violations.

Affected-node counts are not treated as stable because they may vary between executions.

A known rule should not be removed from the baseline because it disappears in a single run.

A newly observed rule should not be added automatically.

Confirm whether it represents an existing production issue or a meaningful regression before changing the baseline.

Automated axe coverage remains a regression signal and does not establish full WCAG compliance.

### Internationalization

The implemented I18N coverage switches from the English experience to Dutch and validates locale persistence through the critical journey.

The same search query can produce different result ordering and lot content under different locales.

Cross-locale assertions must therefore not depend on identical lot IDs, titles, or result positions representing the same underlying item.

The I18N scenario uses a scoped 45-second timeout because repeated full-suite execution showed that the default 30-second budget could be exceeded during the additional locale transition.

Do not increase this timeout further unless new failure evidence demonstrates a genuine need.

### Dynamic production state

Production auction data changes continuously.

Do not replace runtime discovery with hard-coded values only because a currently observed lot appears stable.

Tests should continue to prefer:

```text
discover runtime state
        ↓
capture relevant identity or value
        ↓
perform the behavior
        ↓
validate consistency or invariant
```

This applies especially to:

- Lot IDs
- Titles
- Bids
- Favourite counts
- Auction positions
- Search-result ordering

### API behavior

The suite uses public read-only endpoints discovered through normal application behavior.

Mandatory requests expose useful HTTP failure diagnostics instead of automatically retrying unsuccessful responses.

A non-success response should be investigated according to its actual status and context.

Do not add generic retries to hide:

- Access restrictions
- Throttling
- Server failures
- Contract changes
- Environmental instability

### Scope discipline

Several additional techniques remain technically possible, including broader internationalization, visual regression, performance testing, authenticated workflows, state-changing scenarios, and deeper security testing.

Their absence is not accidental.

Some are lower priority, some require a controlled environment, and some would be inappropriate against production.

Before implementing one of these areas, verify that the required value, authorization, environment, and maintenance cost justify expanding the current scope.