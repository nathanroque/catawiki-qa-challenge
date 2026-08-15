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
  - Exposes lot details such as title, favourite count, and current bid

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

The headless behavior remains an item to investigate before introducing CI execution.

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

The browser performs the normal `"Train"` search and identifies the second lot exactly as a customer would. The lot identifier discovered through the UI is then used to request the corresponding read-only bidding state API.

This validates that the lot presented through the required UI journey is also represented consistently by the backend service, while respecting the production environment constraints.

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

### Accessibility execution cost

The three full-page axe scans were reliable when executed independently, but parallel full-suite execution occasionally caused accessibility scenarios to exceed Playwright's default test timeout.

Rather than reducing parallelism across the entire project, accessibility execution was isolated:

```ts
test.describe.configure({
  mode: 'serial',
  timeout: 60_000,
});
```

This keeps the higher execution cost scoped to accessibility analysis while allowing the remainder of the suite to retain normal parallel execution.

### Late cookie-consent initialization

Repeated execution also revealed that the Usercentrics consent component can finish initializing after the initial navigation-time consent handling has completed.

In one failure, the search button was already visible and enabled, but the consent overlay intercepted pointer events until the test timed out.

The existing consent utility is therefore also invoked immediately before search interaction when needed. Forcing the click through the overlay was intentionally rejected because it would bypass a real user-facing UI state rather than handle it correctly.

### API failure diagnostics

A repeated API execution produced a non-success response that was previously reported only as a failed `response.ok()` assertion.

Mandatory API requests were updated to include the HTTP status, status text, and response body when they fail.

Automatic retries were intentionally not added because different HTTP failures such as throttling, access restrictions, or transient server errors require different investigation and should not be hidden behind generic retry logic.

### CI environment validation

The first GitHub Actions workflow was intentionally limited to TypeScript validation and the pure read-only API scenario so that browser installation and UI execution were not introduced before the production environment behavior was understood.

During the first pull-request execution, repository setup, dependency installation, and TypeScript validation completed successfully. The API scenario then received a `403 Forbidden / Access Denied` response from the production edge layer.

Rather than attempting to make the GitHub-hosted runner resemble a normal customer session or introducing retries around an access restriction, production-facing test execution was removed from the current hosted workflow.

The resulting CI pipeline keeps deterministic static validation automated while acknowledging that production-facing scenarios require an execution environment accepted by the Catawiki production edge layer.

Before introducing the hosted CI workflow, repeated local execution after the reliability changes produced three consecutive successful full-suite runs.
