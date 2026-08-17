# Testing Approach

## 1. Initial exploration

- Manually executed the required search-to-lot journey
- Inspected DOM structure and accessibility semantics
- Observed network traffic
- Identified environmental behavior such as cookies, locale and headless blocking

## 2. Exploratory recording and locator discovery

I used Playwright Codegen to record the expected user journey and inspect the locators Playwright generated automatically.

The recorded flow was not kept as part of the final suite. Instead, it was used as a discovery artifact to compare generated locators against the DOM, accessibility tree, and actual test requirements.

Examples of refinements:

- Replaced a title-based locator for the second lot with a collection-based locator using the second result.
- Replaced a dynamic favourite count locator with a stable semantic locator.
- Scoped the search input to the page header after discovering multiple matching inputs in the DOM.

## 3. Locator refinement

### Search input

Codegen suggested:

page.getByRole('combobox', { name: 'Search for brand, model,' })

## 4. Refactoring into Page Objects

The first version of the critical journey was intentionally implemented directly in the test file.

The goal was to validate the behavior first before introducing abstractions. Once the search-to-lot flow was stable, the implementation was refactored into small Page Objects.

The responsibilities were separated as follows:

- `SearchPage`
  - Opens the application
  - Executes a search

- `SearchResultsPage`
  - Represents the collection of search results
  - Retrieves lot information
  - Opens a selected lot

- `LotPage`
  - Exposes lot details such as title, favourite count, and the visible bidding state and amount

The test remains responsible for the expected behavior and assertions, while the Page Objects contain knowledge about how to interact with each page.

This keeps the scenario readable without hiding the intent of the test behind excessive abstraction.

### Why Page Objects were introduced after the first working test

Creating the Page Objects only after the core flow was working helped avoid speculative abstractions.

The initial implementation revealed the actual interactions and selectors required by the journey, allowing the Page Objects to be designed around real usage rather than assumptions.

The refactoring was validated by running the same scenario again and confirming that behavior remained unchanged.

## 5. Environment and reliability observations

During implementation, different behavior was observed between browser execution modes:

- Headed Chromium successfully loaded the Catawiki application.
- Headless Chromium received an `Access Denied` response.
- Fresh browser contexts may display cookie and locale-related UI.

These behaviors were treated as environmental concerns rather than being hidden through arbitrary waits or broad timeout increases.

Later GitHub-hosted CI execution confirmed that the production edge restriction also affects that environment. Hosted CI therefore remains limited to deterministic repository checks and Playwright discovery rather than attempting to bypass the restriction.

## 6. Expanding Beyond the Core Scenario

The initial implementation covers the core scenario requested in the assignment. However, the assignment explicitly encourages going beyond the minimum implementation:

> "Side Note: The goal of this Assignment is to showcase your knowledge. The Test Scenario is only meant as an inspiration. Try to show that you see different scenarios and understand how to plug your new suite into the CI/CD Pipeline."
>
> — Assignment Instructions

The recruiter also highlighted the importance of thinking beyond a solution that simply works:

> "...aim for a well-rounded and thoughtfully structured solution. Try to think beyond simply building something that works and consider how your solution would operate in a real production environment over the longer term.
>
> For example, think about areas such as scalability, performance, maintainability, reliability, and integration with existing development and deployment processes where relevant. We’re interested not only in the final implementation, but also in the reasoning and trade-offs behind your decisions.
>
> You don’t need to over-engineer the solution, but demonstrating that you’ve considered the broader picture will be valuable."
>
> — Recruiter

With the core scenario working, the next step is therefore to use the remaining scope of the assignment to demonstrate broader software quality and test automation knowledge.

The following principles will guide the expansion of the suite:

- Cover meaningful additional scenarios
- Design the suite with CI/CD execution in mind
- Consider how the solution would behave in a real production environment
- Account for scalability, maintainability, reliability, and performance where relevant
- Avoid unnecessary abstraction or over-engineering
- Document trade-offs and areas intentionally left out of scope

## 7. Risk-Based Expansion and Guardrails

The number of possible tests and techniques is much larger than what is useful for this assignment.

Before expanding the suite, I want to define boundaries based on the fact that the tests are running against a real production environment.

### Production environment guardrails

**No stress or load testing**

The production site should not be intentionally subjected to high request volumes. Besides potentially affecting real users, automated traffic could reasonably be interpreted as abusive or denial-of-service behavior.

**Preserve data integrity**

The suite should avoid creating or modifying persistent production data unless the operation is explicitly safe or easily reversible.

**Respect API boundaries**

Only endpoints naturally exposed through normal customer interactions should be considered for automated API validation. Internal or undocumented services should not be deliberately probed.

**Protect the customer experience**

The automation should behave as a normal visitor and avoid actions that could affect real auctions or users. In particular, no bids, purchases, favourites, account creation, or other state-changing actions should be performed unless explicitly required or reversible.

**Avoid sensitive data**

The suite should not collect, persist, or expose personal, authentication, payment, or other sensitive information.

**Prefer caution over additional coverage**

A technically interesting test is not automatically a valuable test. Any additional scenario should provide meaningful quality information without creating unnecessary risk to the production environment.

With these constraints established, the remaining scenarios can be selected using risk, value, execution cost, and maintainability as the main criteria.

## 8. Test Plan

The expanded test plan will be risk-based and focus on scenarios that provide additional confidence or demonstrate a distinct testing technique without duplicating coverage unnecessarily.

## 9. API reconnaissance and first API test

Initial manual exploration did not reveal an obvious JSON search endpoint, so API testing was initially deferred.

A later focused network investigation using Playwright browser tooling identified several read-only JSON endpoints naturally consumed by the unauthenticated application.

The `/buyer/api/v3/lots/{id}/navigation` endpoint was selected as the first API test because its contract is small and its useful assertions are based on stable relationships rather than volatile auction values.

The test dynamically discovers a current lot, requests its navigation state, follows the returned `next_lot_id`, and validates cross-response invariants such as:

- the next position increments by one;
- the next lot points back to the original lot;
- both responses report the same total number of lots.

This allowed API coverage to be added without hard-coding production lot IDs.

## 10. Search-to-API consistency

The initial design attempted to retrieve the server-rendered search document directly through Playwright's `APIRequestContext`.

The production edge layer returned `403 Access Denied` for that request.

Rather than attempting to bypass the production security behavior, the test was redesigned as a UI/API integration scenario.

The browser performs the canonical `"Train"` search by default and identifies the second lot exactly as a customer would. The shared keyword is centralized in `support/test-data.ts` and can be overridden through `SEARCH_KEYWORD` for local exploratory execution without changing test source.

The scenario was later strengthened beyond identity continuity. After opening the selected lot, the test captures the displayed favourite count plus the visible bidding state and amount, then compares them with `favorite_count` and `current_bid_amount.EUR` for the same runtime lot returned by the bidding API. The UI state remains explicit as either `Current bid` or `Starting bid`, so a valid no-bid production state is not mislabeled as an active bid. This makes the integration assertion about shared business state rather than only confirming that the same identifier exists in both layers.

## 11. API Client and Contract Validation

After the first API and UI/API integration scenarios were working, repeated HTTP configuration started to appear across the tests.

A small `CatawikiApiClient` was introduced to centralize API-specific knowledge such as endpoints and common request headers, while keeping assertions and expected behavior inside the tests.

The same principle used for the Page Objects was applied here:

- Page Objects know how to interact with the UI.
- The API client knows how to communicate with the HTTP endpoints.
- Tests remain responsible for expected behavior.

Runtime schema validation was also added for the navigation and bidding-state responses.

Schema validation is intentionally kept separate from business assertions.

For example, validating that `current_position` is an integer is a contract check, while validating that the next lot position equals the current position plus one is a business invariant.

Only fields relevant to the implemented scenarios are validated to avoid unnecessarily coupling the suite to the complete API implementation.

Sanitized response examples observed during read-only reconnaissance are kept under `docs/api-samples/`. They document the surrounding payload shape but are not used as fixtures, mocks, or complete provider contracts.

Deterministic unit tests were later added around both runtime validators. They cover representative valid and invalid payloads, including null bidding state, malformed currency values, invalid favourite counts, invalid bidding ranges, and non-integer adjacent lot identifiers. This gives CI meaningful schema-validation coverage without requiring production access.

## 12. Negative Search Behavior

A negative search scenario was initially planned as a traditional zero-results test.

During exploratory execution, Catawiki showed a different behavior: when no exact matches are found, the application displays the message:

`No exact results. Check out these related objects.`

and continues by presenting related lots.

The test was adjusted to validate this actual fallback behavior rather than forcing an assumed empty state.

The final scenario verifies that:

- the no-exact-results message is displayed;
- related lot cards are present;
- the result summary identifies the displayed items as related objects.

The exact related-object count is intentionally not asserted because it is dynamic production data.

## 13. Accessibility Baseline Strategy

Automated accessibility coverage was introduced using `@axe-core/playwright`.

The first landing-page scan was initially configured to fail on any `serious` or `critical` violation.

Exploratory execution revealed multiple existing high-severity accessibility findings in the production application.

Rather than suppressing the findings or allowing the accessibility test to remain permanently failing, the scenario was changed to use a known-issue baseline.

The landing page was scanned repeatedly before defining the baseline.

Repeated exploratory and full-suite execution identified a known set of high-severity violation rule IDs. The exact set present in an individual execution and the number of affected DOM nodes may vary because the production page contains dynamic and conditionally rendered content.

For this reason, the baseline is defined by axe violation ID rather than requiring every known rule to appear in every execution or comparing exact node counts.

The test:

- reports all current high-severity findings;
- accepts explicitly documented known violation IDs;
- fails if a new `serious` or `critical` violation rule appears.

This keeps accessibility automation useful as a regression signal while acknowledging existing production accessibility debt that is outside the scope of this challenge.

Known violations are kept separately from the test implementation so that the baseline remains explicit and reviewable.

The baseline does not classify these findings as acceptable product behavior. It only distinguishes pre-existing production findings from newly detected accessibility regressions within the scope of this external assessment.

## 14. Reporting Readability and Public API Documentation

As the suite expanded across E2E, API, integration and accessibility layers, the generated Playwright report began exposing many low-level implementation actions that were useful for debugging but less useful for a reviewer trying to understand the scenario.

Meaningful `test.step()` blocks were therefore introduced around behavioral and validation phases of the existing tests.

The goal is not to wrap every Playwright command in a named step. Steps should describe intent at the scenario level, such as:

- opening the application;
- performing the search;
- capturing runtime identity;
- validating cross-page consistency;
- requesting API state;
- validating a response contract;
- comparing accessibility findings with the known baseline.

This keeps the HTML report readable for technical and non-technical reviewers while preserving Playwright's lower-level diagnostic information when a step is expanded.

Public Page Object and API client methods were also documented with JSDoc where the method contract, indexing convention, return value or responsibility benefits from clarification.

The documentation is intentionally kept close to the implementation so that IDE tooling can surface it during development without creating a separate reference document that could drift away from the code.

The underlying design boundary remains unchanged:

- Page Objects describe how to interact with UI areas.
- The API client describes how to call selected read-only HTTP endpoints.
- Tests describe expected behavior and assertions.
- Named test steps describe the scenario narrative shown in reports.

## 15. Reliability Hardening Through Repeated Execution

After the initial P0, API, integration, negative, and accessibility scenarios were implemented, the complete suite was executed repeatedly to identify reliability problems that were not visible when tests were run in isolation.

This exposed several distinct failure modes that were intentionally addressed at their source rather than through broad timeout increases or unconditional retries.

### Accessibility execution cost and readiness

The three full-page axe scans have a higher execution cost than the functional scenarios and retain a dedicated 60-second timeout.

The scenarios were initially serialized, but this introduced an undesirable failure dependency: one failed accessibility test could prevent later independent page contexts from running. Serial mode was removed, and each page now establishes meaningful readiness before Axe executes. Search results must be visible before the results scan, and the lot title must be visible after navigation before the lot-details scan.

Repeated execution with two workers completed successfully after these changes, preserving independent reporting without increasing the timeout globally.

### Late cookie-consent initialization

Repeated execution revealed that Usercentrics can initialize several seconds after `DOMContentLoaded`, after the application and search field are already visible.

A focused browser investigation showed that the component is mounted under `aside#usercentrics-cmp-ui` with an open shadow root. The full-screen `#uc-overlay` is the element that actually intercepts pointer input, while the dismissal action is an `<a id="uc-close-icon">` without reliable button or link semantics. Its visible text can also be localized independently of the `/en` route.

The support helper was therefore changed to synchronize on the actual blocking overlay, use the scoped Usercentrics action, and verify that the overlay becomes hidden. The helper uses bounded waits based on observed initialization timing, with no `waitForTimeout()`, `force: true`, opaque storage preload, or general retry loop.

Consent handling remains an environment concern performed after initial navigation rather than being spread across every Page Object action.

### API failure diagnostics

A repeated API execution produced a non-success response that was previously reported only as a failed `response.ok()` assertion.

Mandatory API requests were updated to include the HTTP status, status text, and response body when they fail.

Automatic retries were intentionally not added because different HTTP failures such as throttling, access restrictions, or transient server errors require different investigation and should not be hidden behind generic retry logic.

### CI environment validation

The first GitHub Actions workflow was intentionally limited so that the hosted execution environment could be validated before broader production-facing coverage was introduced.

During the first pull-request execution, repository setup, dependency installation, and TypeScript validation completed successfully. The read-only production API scenario then received a `403 Forbidden / Access Denied` response from the production edge layer.

Rather than attempting to make the GitHub-hosted runner resemble a normal customer session or introducing retries around an access restriction, production-facing test execution was removed from the current hosted workflow.

The hosted pipeline was subsequently strengthened with deterministic repository checks that do not require production access:

```text
npm run quality
├── TypeScript type check
├── ESLint
├── Prettier format check
└── schema validator unit tests

Playwright discovery
├── default configuration
└── cross-browser configuration
```

This provides enforceable CI feedback while acknowledging that production-facing scenarios require an execution environment accepted by the Catawiki production edge layer.

## 16. Cross-Browser Validation Strategy

With the P1 functional, API, integration, and accessibility coverage stable, the critical smoke journey was evaluated across the three browser engines supported by Playwright: Chromium, Firefox, and WebKit.

The existing P0 scenario was reused rather than creating browser-specific copies of the same test.

Initial isolated execution confirmed that the journey could complete successfully in all three browsers.

The first combined configuration added Firefox and WebKit as additional Playwright projects while retaining the normal parallel execution model. During full-suite execution, the Firefox and WebKit smoke scenarios experienced intermittent timeouts in different stages of the journey.

One failure occurred while waiting for lot navigation to complete. Another occurred when a late Usercentrics consent overlay intercepted the search interaction. The consent interaction was later hardened independently after direct investigation of the Usercentrics lifecycle.

Because all three browsers had already succeeded independently, the next experiment reduced cross-browser concurrency rather than increasing global timeouts or introducing retries.

Running the configured suite with a single worker completed successfully across all nine resulting executions.

The final design therefore separates normal and cross-browser execution:

```text
playwright.config.ts
└── Chromium-only default suite

playwright.cross-browser.config.ts
└── @smoke only
    ├── Chromium
    ├── Firefox
    └── WebKit
        └── single worker
```

This keeps normal development execution fast and predictable while providing deliberate cross-browser validation of the highest-value user journey.

The single-worker constraint is scoped to cross-browser execution and does not reduce parallelism for the normal Chromium suite.

After the consent helper was hardened, Firefox still exceeded the default 30-second test budget in the final lot-details step during repeated cross-browser validation. A 45-second timeout was therefore scoped to the dedicated cross-browser configuration. Three isolated Firefox runs and three complete cross-browser runs then completed without failure, so no locator-level timeout or retry was added.

## 17. Internationalization Coverage

After the P0 and P1 coverage was stable, internationalization was selected as an additional P2 scenario because it introduced a new quality dimension without requiring destructive production interaction.

The scenario was explored manually before automation.

The English application experience was opened explicitly through `/en`, and the public language selector was used to switch the interface to Dutch.

Exploration confirmed that:

- the application moved to the `/nl` locale;
- stable application-owned UI such as the search input was translated;
- the search journey remained within the Dutch locale;
- opening a lot preserved the Dutch locale.

The automated scenario therefore uses both URL state and stable translated application UI as deterministic localization signals.

Dynamic lot content is intentionally excluded from translation assertions.

During exploration, the same `Train` query produced different result ordering and lot content between the English and Dutch experiences. This reinforced the existing runtime-data strategy: the test discovers the second result within the active locale rather than expecting the same lot to appear across languages.

### I18N reliability

The internationalization scenario completed successfully when executed independently.

During repeated parallel full-suite execution, the scenario intermittently exceeded Playwright's default 30-second timeout while still progressing through valid Dutch search-result states.

Because the scenario introduces an additional locale transition before the existing search-to-lot journey, its execution budget was increased locally to 45 seconds.

The broader suite timeout and retry strategy were left unchanged.

Three consecutive full-suite executions completed successfully after the scoped timeout adjustment.

## 18. Search Result View-Mode Exploration

A later exploratory pass examined the two search-result presentation modes exposed by the application:

```text
view-mode-gallery
view-mode-normal
```

Playwright Codegen was used to exercise the mode controls and inspect the generated interaction path, while the DOM was compared directly in both states.

The exploration showed that both presentations preserve the same stable result-container contract:

```text
data-testid="lot-card-container-{lotId}"
```

However, the internal title markup changes between layouts:

```text
gallery → .c-lot-card__title
normal  → .c-extended-lot-card__title
```

This exposed a real coupling in `SearchResultsPage.getLotTitle()`. The existing implementation only targeted the gallery title selector. When an exploratory E2E scenario switched the `Train` results to normal view and attempted to inspect the second lot, the test timed out waiting for `.c-lot-card__title`.

Rather than creating separate Page Object methods for each presentation, title retrieval was hardened to support both known title representations while preserving the existing stable lot-container abstraction.

The scenario then completed successfully in normal view, including:

- locating the second result;
- retrieving its runtime title;
- extracting its lot ID;
- opening the same lot and validating the resulting URL.

The same scenario was extended to return to the search results and reload the page. Normal view remained active across both boundaries.

The active-state control itself currently exposes the selected mode through a generated CSS-module class rather than an accessibility state such as `aria-pressed` or `aria-selected`. The exploration therefore validated the active presentation through the rendered result structure instead of making the generated class name a permanent test oracle.

The storage mechanism behind the persisted preference was not investigated further. The observed behavior is documented without assuming whether the state is backed by cookies, local storage, or another implementation detail.

This exploration produced a concrete framework improvement and a focused P2 regression scenario. The test was promoted into the maintained suite because it exercises a distinct presentation-state risk and had already exposed a real Page Object coupling.

Broader preference matrices remain deferred; the maintained scenario covers only the observed normal-view path and persistence boundaries that provided useful signal.

## 19. Representative Mobile Validation

Responsive behavior was sampled with Playwright's `iPhone 13` device profile rather than by resizing the desktop viewport.

The first mobile execution exposed a real interaction difference in the application header: the desktop search combobox is directly available, while the mobile layout requires opening the mobile search control before the input becomes visible. `SearchPage.searchFor()` was hardened to handle this responsive state while preserving the same public Page Object method for both layouts.

Extending the mobile scenario to retrieve the same lot information as the P0 desktop journey exposed a second difference. The bid state is rendered through responsive structures that may coexist in the DOM. A global text locator therefore became ambiguous on desktop after the initial mobile hardening.

`LotPage.getBidStatus()` was refined to resolve the visible supported bid label and read the amount associated with that visible representation. This avoids separate desktop and mobile methods and keeps the abstraction aligned with what the user can actually see.

The representative mobile scenario now validates the same core runtime information as the desktop journey:

- selected lot identity;
- lot title;
- favourite count;
- visible bidding state and amount.

Both the desktop smoke scenario and the mobile scenario were rerun after the Page Object changes and passed. The mobile scenario was then included in the complete Chromium suite and passed as part of the 24-test run.

This remains selective responsive coverage, not a claim of full device compatibility. Broader mobile and tablet matrices remain future work.

## 20. Controlled Default Parallelism

The default configuration originally used `fullyParallel: true` with no explicit local worker cap. That behavior was reconsidered because the complete suite targets a live production environment and should not generate machine-dependent concurrency.

The default Chromium execution is now intentionally bounded:

```text
fullyParallel: false
local workers: 2
CI workers: 1
```

Two local workers preserve useful execution speed while keeping production traffic modest and predictable. The dedicated cross-browser configuration remains serialized with one worker because that execution mode previously demonstrated concurrency-related instability.

The complete default suite was validated after this change: 24 tests passed with two workers in approximately 1.2 minutes. This provides evidence for the selected limit rather than treating the worker count as an arbitrary configuration preference.
