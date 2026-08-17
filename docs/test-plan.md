# Test Plan

## 1. Purpose

This document defines the testing scope for the Catawiki QA challenge after completion of the initial required search-to-lot journey.

The goal is not to maximize the number of automated tests, but to build a small, representative, maintainable and production-conscious test suite that demonstrates different software quality techniques.

Test selection is based on:

- Quality risk
- Confidence gained
- Execution cost
- Maintainability
- Production safety
- CI/CD suitability
- Relevance to the assignment

The test plan intentionally contains more ideas than the final implementation is required to contain.

Lower-priority scenarios should only be implemented if the higher-priority suite remains reliable and maintainable.

## 2. Test Context

The system under test is the public Catawiki production website.

The initial assignment journey is:

```gherkin
Scenario: User can search for Train and inspect the second lot

  Given I am on the Catawiki landing page
  When I search for "Train"
  And I select the second lot from the search results
  Then the selected lot page should open successfully
  And the opened lot should match the lot selected from the search results
  And I should be able to retrieve the lot title
  And I should be able to retrieve the favourites count
  And I should be able to retrieve the current bid
```

Search results and auction information are dynamic production data.

The primary E2E journey uses the English locale explicitly (`/en`) to avoid environment-dependent redirects and localized locator behavior.

The implementation centralizes the canonical search keyword in `support/test-data.ts`. It defaults to `Train` to preserve the assignment scenario and may be overridden through `SEARCH_KEYWORD` for local exploratory reuse. Gherkin examples in this plan continue to use `Train` because they describe the canonical assessment flow rather than every optional runtime variation.

Locale switching and translation behavior are covered separately by the internationalization scenarios.

The suite should therefore avoid relying on fixed lot titles, IDs, favourite counts, bid values or other volatile production data whenever possible.

## 3. Test Principles

### Test behavior rather than current production data

The suite should express the expected behavior rather than encode the current state of production.

For example, the second search result should be selected by position instead of depending on its current lot title.

### Prefer stable and user-facing locators

Locator priority is approximately:

1. Accessible roles and names
2. Labels and placeholders
3. Stable test IDs
4. Intent-revealing CSS selectors when no stronger locator exists

DOM structure and generated styling classes should be avoided whenever practical.

### Avoid fixed volatile assertions

Auction data changes continuously.

Instead of:

```ts
expect(currentBid).toBe('€28');
```

the suite should validate properties such as:

- a supported visible bidding state exists (`Current bid` or `Starting bid`);
- the associated value follows an expected monetary format;
- the selected lot identity remains consistent after navigation.

### No arbitrary waits

Tests should rely on Playwright auto-waiting and web-first assertions rather than fixed `waitForTimeout()` calls.

### Tests should be independently executable

No test should depend on another test being executed first.

### Production interactions must remain non-destructive

The [production guardrails](adr/004-production-test-guardrails.md) defined in ADR 004 apply to all scenarios in this plan.

### Additional tests must justify their cost

A technically interesting test is not automatically a valuable test.

New scenarios should provide a meaningful quality signal without introducing disproportionate maintenance cost, instability or production risk.

## 4. Priority Model

### P0 — Critical

Required for the core assignment and expected to remain highly reliable.

### P1 — High Value

Adds meaningful confidence or demonstrates an important additional quality dimension at reasonable implementation and maintenance cost.

### P2 — Stretch

Useful additional coverage that should only be implemented after P0 and P1 are stable.

### Experimental

Demonstrates an interesting testing technique, but should not be treated as the primary test oracle.

### Deferred

Potentially valuable under different environmental or organizational conditions, but deliberately not implemented within the current constraints.

## 5. Coverage Overview

| ID       | Scenario                                                                            | Layer                         | Priority     | Status      | Intended CI Target |
| -------- | ----------------------------------------------------------------------------------- | ----------------------------- | ------------ | ----------- | ------------------ |
| E2E-001  | Search `Train` → open second lot → validate lot details and identity                | E2E / Smoke                   | P0           | Implemented | PR                 |
| E2E-002  | Nonsense search → no exact results message + related-object fallback                | E2E / Negative                | P1           | Implemented | PR                 |
| API-001  | Second Train search lot has consistent bidding API state                            | UI/API Integration + Contract | P1           | Implemented | PR                 |
| API-002  | Lot navigation remains internally consistent                                        | API + Contract                | P1           | Implemented | PR                 |
| UNIT-001 | Bidding-state runtime schema validator accepts and rejects representative payloads  | Unit / Schema                 | P1           | Implemented | PR                 |
| UNIT-002 | Lot-navigation runtime schema validator accepts and rejects representative payloads | Unit / Schema                 | P1           | Implemented | PR                 |
| A11Y-001 | Landing page has no unexpected serious or critical accessibility violations         | Accessibility                 | P1           | Implemented | Scheduled / Report |
| A11Y-002 | Search results page has no unexpected serious or critical accessibility violations  | Accessibility                 | P1           | Implemented | Scheduled / Report |
| A11Y-003 | Lot details page has no unexpected serious or critical accessibility violations     | Accessibility                 | P1           | Implemented | Scheduled / Report |
| XB-001   | Critical journey runs across Chromium, Firefox and WebKit                           | Cross-browser                 | P1           | Implemented | Nightly            |
| E2E-003  | Search handles benign special characters gracefully                                 | E2E / Edge                    | P2           | Candidate   | Nightly            |
| E2E-004  | Second search result remains usable and view preference persists in normal mode     | E2E / Preference              | P2           | Implemented | Nightly            |
| MOB-001  | Critical Train journey remains usable on a representative mobile device             | E2E / Responsive              | P2           | Implemented | Nightly            |
| I18N-001 | Selected language persists across the critical journey                              | Internationalization          | P2           | Implemented | Nightly            |
| I18N-002 | Sampled interface text predominantly matches selected language                      | Internationalization          | Experimental | Candidate   | Nightly            |
| VIS-001  | Stable UI region matches approved visual baseline                                   | Visual                        | P2           | Candidate   | Nightly            |

The CI targets above describe the intended execution stage when an approved production-facing environment is available. The current GitHub-hosted workflow runs deterministic quality checks and Playwright test discovery only, because direct production access from the hosted runner is blocked by the Catawiki edge layer.

## 6. P0 Coverage

### E2E-001 — Critical Search-to-Lot Journey

**Layer:** E2E / Smoke  
**Priority:** P0  
**Intended CI target:** Pull Request  
**Status:** Implemented

```gherkin
Scenario: User can search for Train and inspect the second lot

  Given I am on the Catawiki landing page
  When I search for "Train"
  And I select the second lot from the search results
  Then the selected lot page should open successfully
  And the opened lot should match the lot selected from the search results
  And I should be able to retrieve the lot title
  And I should be able to retrieve the favourites count
  And I should be able to retrieve the current bid
```

#### Test intent

This scenario represents the critical journey requested by the assignment.

Before navigation, the test captures runtime information about the selected lot. After navigation, that information is used to ensure the application opened the same lot rather than simply confirming that any lot page loaded.

The title consistency validation remains part of this scenario rather than being duplicated into another E2E test unless a future requirement creates a meaningful reason to separate it.

#### Volatile data

Values such as:

- Current bid
- Favourite count
- Lot title
- Lot ID

are discovered dynamically during execution.

The test validates their existence, structure and consistency instead of comparing them against hard-coded production values. It also states the dynamic-data precondition explicitly by requiring at least two visible search results before selecting the second lot.

The bid section is read by its semantic state (`Current bid` or `Starting bid`) and associated amount. The assignment asks for the current bid, but live production data can legitimately place the dynamically selected second lot in a no-bid state where the UI exposes `Starting bid` instead. The maintained P0 therefore accepts either supported UI state while keeping the label explicit, validating the monetary amount, and avoiding the false claim that a starting bid is an active current bid.

#### Assignment output

The scenario records:

```text
title
favouritesCount
bidStatus
bidAmount
```

These values are informational output rather than fixed expected data.

## 7. P1 Coverage

### E2E-002 — Search With No Exact Results

**Layer:** E2E / Negative  
**Priority:** P1  
**Intended CI target:** Pull Request  
**Status:** Implemented

```gherkin
Scenario: User searches for a query with no exact matches

  Given I am on the Catawiki landing page
  When I search for a deterministic nonsense query
  Then the search should complete successfully
  And the application should indicate that no exact results were found
  And related objects should be displayed as a fallback
```

#### Test intent

The initial expectation was that a nonsense query would produce an empty-results state.

Exploration showed that Catawiki instead provides a fallback experience: it informs the user that no exact results were found and displays related objects.

The automated test therefore validates the real product behavior rather than an assumed empty state.

The test does not assert the exact number of related objects because that value is dynamic production data.

### A11Y-001 — Landing Page Accessibility Scan

**Layer:** Accessibility  
**Priority:** P1  
**Intended CI target:** Scheduled / Report  
**Status:** Implemented

```gherkin
Scenario: Landing page has no unexpected high-severity accessibility violations

  Given I am on the Catawiki landing page
  When an automated accessibility scan is executed
  Then no unexpected serious or critical accessibility violation rules should be found
```

#### Test intent

The landing page is scanned with `@axe-core/playwright` to provide an automated accessibility regression signal.

The implemented scenario uses an explicit rule-ID baseline for high-severity production findings already observed in this page context. It fails when a new `serious` or `critical` rule ID appears while keeping known findings visible for review.

The detailed production evidence and limitations of rule-ID baselining are documented in [Accessibility observations](findings.md#accessibility-observations). The durable baseline policy and trade-offs are recorded in [ADR 006 — Accessibility Baseline](adr/006-accessibility-baseline.md).

Current landing-page baseline:

```text
aria-hidden-focus
aria-required-children
aria-required-parent
button-name
color-contrast
link-name
nested-interactive
scrollable-region-focusable
svg-img-alt
```

Automated axe findings are quality signals and should not be treated as proof of complete WCAG compliance or as independently confirmed product defects without appropriate review.

### A11Y-002 — Search Results Accessibility

**Layer:** Accessibility  
**Priority:** P1  
**Intended CI target:** Scheduled / Report  
**Status:** Implemented

```gherkin
Scenario: Search results have no unexpected high-severity accessibility violations

  Given I am on the Catawiki landing page
  When I search for "Train"
  And the search results are displayed
  And an automated accessibility scan is executed
  Then no unexpected serious or critical accessibility violation rules should be found
```

#### Test intent

The search-results page is scanned independently from the landing page so that
existing accessibility findings remain specific to the page context in which
they were observed.

The known high-severity rule IDs for this page context are:

```text
button-name
color-contrast
svg-img-alt
```

Reproduction details and the observed variability behind this baseline are kept in [Search-results accessibility observations](findings.md#search-results-known-rule-ids).

### A11Y-003 — Lot Details Accessibility

**Layer:** Accessibility  
**Priority:** P1  
**Intended CI target:** Scheduled / Report  
**Status:** Implemented

```gherkin
Scenario: Lot details page has no unexpected high-severity accessibility violations

  Given I have searched for "Train"
  And I have opened the second lot from the results
  When I run an automated accessibility scan
  Then no unexpected serious or critical accessibility violation rules should be found
```

#### Test intent

The lot-details page is scanned using its own accessibility baseline rather
than inheriting findings from either the landing page or search-results page.

The known high-severity rule IDs for this page context are:

```text
button-name
color-contrast
link-name
scrollable-region-focusable
svg-img-alt
```

The intermittent `link-name` observation, affected-node variability, and baseline limitations are documented in [Lot-page accessibility observations](findings.md#lot-page-known-rule-ids).

#### Accessibility scope

Automated accessibility testing provides a useful regression signal but does not prove complete WCAG compliance.

Manual accessibility analysis remains outside the scope of this assignment. Broader accessibility work is tracked in [Future Opportunities](future-opportunities.md#accessibility).

Accessibility scans currently act as reporting and regression checks rather than strict zero-violation PR gates because the production environment contains pre-existing automated findings outside the scope of this project.

### XB-001 — Cross-Browser Critical Journey

**Layer:** Cross-browser E2E  
**Priority:** P1  
**Intended CI target:** Nightly  
**Status:** Implemented

```gherkin
Scenario Outline: Critical journey works across supported browsers

  Given I am using <browser>
  And I am on the Catawiki landing page
  When I search for "Train"
  And I select the second lot from the search results
  Then the corresponding lot page should open successfully
  And the selected lot identity should remain consistent

Examples:
  | browser  |
  | Chromium |
  | Firefox  |
  | WebKit   |
```

#### Test strategy

The existing P0 smoke scenario is reused across Chromium, Firefox, and WebKit rather than duplicated into browser-specific test files.

Cross-browser execution uses a dedicated Playwright configuration that:

- selects only the `@smoke` scenario;
- defines Chromium, Firefox, and WebKit projects;
- uses a single worker.

The default Playwright configuration remains Chromium-only so that normal suite execution does not unintentionally multiply all API, accessibility, integration, and E2E scenarios across every browser.

#### Reliability observation

Cross-browser smoke execution is intentionally serialized because concurrent multi-project runs showed timing instability against the live production environment.

The observation history is recorded in [Execution observations](findings.md#execution-observations), while the durable single-worker strategy and trade-offs are captured in [ADR 007 — Cross-Browser Execution Strategy](adr/007-cross-browser-execution-strategy.md).

## 8. P2 / Stretch Coverage

### E2E-003 — Special Character Search

**Layer:** E2E / Edge  
**Priority:** P2  
**Intended CI target:** Nightly  
**Status:** Candidate

```gherkin
Scenario: Search handles benign special characters gracefully

  Given I am on the Catawiki landing page
  When I submit a search containing benign special characters
  Then the application should process the request without failing
  And a valid search state should be displayed
```

#### Test intent

This scenario provides a lightweight robustness check around search input handling.

It should remain limited to normal user input and should not evolve into fuzzing, injection testing or security probing against production.

### E2E-004 — Alternate Search Result View

**Layer:** E2E / Preference  
**Priority:** P2  
**Intended CI target:** Nightly  
**Status:** Implemented

```gherkin
Scenario: Second Train result remains usable in normal view

  Given I have searched for "Train"
  When I switch the search results from gallery view to normal view
  Then the second result should remain identifiable and usable

  When I open the second lot and return to the search results
  Then normal view should remain active

  When I reload the search results
  Then normal view should remain active
```

#### Test intent

This scenario covers a distinct presentation-state risk without multiplying the critical journey across every available preference.

Exploration showed that gallery and normal modes preserve the same stable lot-container contract while rendering the title through different internal markup. The initial Page Object was coupled to the gallery representation and failed when the same result was inspected in normal view.

`SearchResultsPage` was hardened to support both observed title representations while keeping result identity anchored to the stable `lot-card-container-*` contract.

The scenario validates persistence behavior through navigation back to the result page and through a reload. It deliberately avoids asserting the generated active CSS-module class; the selected mode is inferred from the rendered normal-view result structure.

The underlying persistence mechanism is intentionally not assumed.

### MOB-001 — Representative Mobile Critical Journey

**Layer:** E2E / Responsive  
**Priority:** P2  
**Intended CI target:** Nightly  
**Status:** Implemented

```gherkin
Scenario: User completes the critical Train journey on a representative mobile device

  Given I am using a representative iPhone device profile
  When I search for "Train"
  And I select the second lot from the search results
  Then the selected lot page should open successfully
  And the opened lot should match the selected result
  And I should be able to retrieve the lot title
  And I should be able to retrieve the favourites count
  And I should be able to retrieve the visible bidding state and amount
```

#### Test intent

This scenario samples responsive compatibility with Playwright's `iPhone 13` device profile instead of reproducing the complete desktop suite across a device matrix.

Exploration exposed two responsive implementation differences that required framework hardening:

- the mobile header keeps the search combobox hidden until the mobile search control is opened;
- multiple responsive bid representations may coexist in the DOM, so the lot helper must resolve the visible bid state rather than assuming a desktop-only container.

The same Page Objects and business assertions are reused across desktop and mobile. This demonstrates that responsive differences are encapsulated in the interaction layer rather than duplicated into device-specific test logic.

The scenario remains P2 because one representative profile is a compatibility signal, not evidence of complete mobile or tablet coverage.

## 9. Internationalization Coverage

### I18N-001 — Language Selection and Persistence

**Layer:** Internationalization / E2E  
**Priority:** P2  
**Intended CI target:** Nightly  
**Status:** Implemented

```gherkin
Scenario: Selected language persists throughout the critical journey

  Given I am using the English Catawiki experience
  When I change the interface language to Dutch
  Then the Dutch locale should become active
  And stable application UI should be displayed in Dutch

  When I search for "Train"
  Then the search results should remain in the Dutch locale

  When I open the second lot from the results
  Then the lot page should remain in the Dutch locale
  And the selected language should remain active
```

#### Test strategy

The scenario starts from the explicit English `/en` experience and changes the application language to Dutch through the public language selector.

Locale persistence is validated using deterministic application-owned signals:

- Locale-specific URL state
- The translated search input accessible name
- The active locale shown in the language selector
- Persistence of `/nl` through search and lot navigation

Lot titles, IDs, seller-provided content, and other dynamic auction data are not used as translation expectations.

During exploratory execution, the `Train` search produced different result ordering and lot content between the English and Dutch locales.

The scenario therefore does not compare search-result identity or ordering across locales. The second result is discovered dynamically within the active locale and is used only to continue the journey.

#### Reliability

The scenario performs an additional locale transition before the search-to-lot journey and intermittently exceeded Playwright's default 30-second test timeout during parallel full-suite execution.

The timeout is therefore scoped to this scenario at 45 seconds.

No global timeout increase or additional retry behavior was introduced.

After the scoped timeout adjustment, three consecutive full-suite executions completed successfully.

### I18N-002 — Language Recognition Heuristic

**Layer:** Internationalization  
**Priority:** Experimental  
**Intended CI target:** Nightly  
**Status:** Candidate

```gherkin
Scenario: Application interface predominantly matches the selected language

  Given I have selected a supported language
  And I have navigated through the critical journey
  When I collect text from selected application-owned UI regions
  And I analyze the text using a language recognition library
  Then the predominant detected language should correspond to the selected language
```

#### Test intent

Language recognition could provide an additional signal that a page has not unexpectedly fallen back to another language.

However, language detection should not be the primary test oracle.

Catawiki pages may legitimately contain mixed-language content such as:

- Lot titles
- Seller descriptions
- Brand names
- Artist names
- Locations
- Product terminology
- Proper nouns

For that reason, language analysis should preferably use only application-owned interface regions and should supplement deterministic localization assertions.

A detection failure should be interpreted carefully rather than automatically proving a localization defect.

## 10. Visual Coverage

### VIS-001 — Stable UI Visual Regression

**Layer:** Visual  
**Priority:** P2  
**Intended CI target:** Nightly  
**Status:** Candidate

```gherkin
Scenario: Stable application UI has no unexpected visual regression

  Given I am on a deterministic application state
  When I capture a stable UI region
  Then it should match the approved visual baseline within the configured tolerance
```

#### Test strategy

Dynamic auction cards are poor initial visual baseline candidates because they may contain continuously changing:

- Images
- Prices
- Timers
- Favourite counts
- Lot descriptions
- Auction data

A smaller and more deterministic interface region should therefore be preferred.

Potential candidates include:

- Search component
- No-exact-results fallback state
- Stable navigation elements

If no sufficiently deterministic region can be identified, visual regression testing should remain deferred rather than introducing a noisy test.

## 11. Scenarios Considered but Not Prioritized

The following scenarios were considered but currently provide insufficient additional confidence compared with their implementation or maintenance cost.

### Empty search

```gherkin
Scenario: User submits an empty search

  Given I am on the Catawiki landing page
  When I submit the search without entering a query
  Then the application should handle the input gracefully
```

Potentially useful, but it overlaps substantially with other search input validation scenarios.

### Whitespace-only search

```gherkin
Scenario: User submits a whitespace-only search

  Given I am on the Catawiki landing page
  When I search using only whitespace
  Then the application should handle the input gracefully
```

This represents approximately the same risk class as empty input.

Implementing both would likely provide little additional confidence.

### Search casing

Possible inputs include:

```text
Train
train
TRAIN
```

Case handling is worth considering, but running several nearly identical E2E scenarios would increase execution cost without proportionally increasing confidence.

### Very long search query

A very long input could provide a robustness signal, but it begins moving toward fuzz or boundary testing.

Given that the suite executes against production, this is currently considered low priority.

### Specific lot by name

Selecting a known lot by hard-coded title would couple the test to temporary production data.

The suite should instead discover suitable lots dynamically.

### Different result positions

The critical journey already proves that a search result can be selected and opened successfully.

Tests that only change the selected position would largely duplicate existing behavior.

### Search sorting and filtering

Exploratory testing showed that search sorting and category filters are represented through visible UI controls and URL state.

A future scenario could validate that changing a supported sort or filter updates the observable search state consistently across the UI, URL parameters and resulting content.

This is intentionally not implemented in the current suite because it would expand search-specific coverage after higher-value negative, view-mode and responsive risks are already represented.

### Broader view-mode and device matrices

The implemented P2 scenarios now cover one alternate search-result presentation and one representative mobile device profile.

Broader matrices remain intentionally deferred. Possible future expansion includes additional persistence boundaries, tablet layouts, other high-value device profiles, and explicit compatibility checks across both search-result presentations.

This should remain risk-based rather than multiplying the complete suite across every presentation and device combination.

### Pagination

Pagination represents a potentially meaningful independent workflow and may be considered later.

A useful pagination test would validate behavior rather than simply retrieving another lot.

For example:

```gherkin
Scenario: User navigates between search result pages

  Given search results contain multiple pages
  When I navigate to the next results page
  Then a new result set should be displayed
  And the pagination state should reflect the selected page
```

This remains a candidate rather than a current priority.

## 12. API, Contract and Integration Testing

Initial browser exploration showed that the main search result page is server-rendered rather than backed by a dedicated JSON search endpoint.

For example:

```text
GET /en/s?q=Train
```

returns an HTML document containing serialized Next.js data.

However, further network reconnaissance identified several read-only JSON endpoints used by the public application during normal unauthenticated browsing.

The most relevant candidates are:

```text
GET /buyer/api/v3/bidding/lots?ids={lotIds}
GET /buyer/api/v3/lots/{lotId}/navigation
GET /buyer/api/v3/lots/{lotId}/bids
```

Observed API behavior and its production context are documented in [API and network observations](findings.md#api-and-network-observations). Sanitized payload examples are available in [API Response Samples](api-samples/README.md).

Direct requests to these endpoints can be executed without authentication or prior browser navigation when the client explicitly requests JSON:

```http
Accept: application/json
```

No authenticated session or manually supplied cookies are required.

### Testing Strategy

API tests should focus on structural contracts and business invariants rather than exact production values.

For example, bidding-state tests may validate:

- The response is successful JSON.
- Returned lot IDs belong to the requested set.
- Lot and auction identifiers are valid positive values.
- Favourite counts are non-negative.
- Bidding start and end timestamps are valid and correctly ordered.

Navigation tests may validate:

- `current_position` remains within `1..total_lots`.
- Adjacent lots preserve consistent auction size.
- A next lot reports the original lot as its previous lot.
- Moving to the next lot increments the current position by one.

Exact values such as bids, favourite counts, lot ordering and auction state should not be hard-coded because they represent live production data.

### Search API Consideration

The main search flow should not be represented as a pure API test because its primary response is server-rendered HTML.

Extracting `__NEXT_DATA__` may be useful for higher-level integration analysis, but it is not currently prioritized over the clearer JSON contracts above.

### Implemented API Coverage

Both implemented API-related scenarios include runtime validation of the response structures used by the tests.

Contract validation is intentionally limited to fields relevant to the implemented scenarios, while behavioral and cross-response assertions remain in the tests. The reasoning behind this boundary is described in [Focused runtime validation](approach.md#focused-runtime-validation).

The runtime validators are additionally covered by deterministic unit tests for accepted and rejected payloads. These tests exercise schema logic without requiring browser startup or production access and are part of the hosted CI quality gate.

Sanitized examples of the observed read-only payload shapes are stored under `docs/api-samples/` for reviewer context. They are documentation only and are not deterministic fixtures, mocked responses, or complete provider contracts.

#### API-001 — UI/API Bidding State Consistency

**Layer:** UI/API Integration + Contract  
**Priority:** P1  
**Intended CI target:** Pull Request  
**Status:** Implemented

```gherkin
Scenario: Second Train search lot has consistent bidding API state

  Given I am on the Catawiki landing page
  When I search for "Train"
  And I identify and open the second lot from the search results
  And I capture its displayed favourite count, bidding state and bid amount
  And I request the bidding state for that lot
  Then the bidding response should contain the selected lot
  And the API favourite count should match the displayed favourite count
  And the API EUR bid amount should match the displayed euro bid amount
  And the bidding response should satisfy the selected runtime schema expectations
```

##### Test intent

This scenario combines read-only runtime schema validation with a meaningful UI/API consistency check.

The UI and API are correlated using runtime lot identity, then shared business state is compared across layers: favourite count and the displayed euro bid amount. The UI keeps the semantic state explicit as `Current bid` or `Starting bid`; the observed bidding payload exposes the comparable value through `current_bid_amount.EUR`. Structural API expectations remain in the schema validator rather than being presented as UI/API comparisons.

#### API-002 — Lot Navigation Consistency

**Layer:** API + Contract  
**Priority:** P1  
**Intended CI target:** Pull Request  
**Status:** Implemented

```gherkin
Scenario: Auction navigation remains internally consistent

  Given I have a valid lot with an adjacent lot
  When I request its navigation information
  Then its current position should be within the navigation range

  When I request the navigation information for the next lot
  Then the next lot position should immediately follow the original position
  And the next lot should reference the original lot as its previous lot
  And both lots should belong to the same navigation sequence
```

##### Test intent

This test validates relationships across multiple API responses rather than only checking individual response fields.

The assertions deliberately avoid hard-coded lot IDs, auction positions or auction sizes.

#### UNIT-001 — Bidding-State Schema Validator

**Layer:** Unit / Schema  
**Priority:** P1  
**Intended CI target:** Pull Request  
**Status:** Implemented

##### Test intent

The bidding-state runtime validator is exercised with deterministic in-memory payloads so its behavior can be verified without production access.

The unit coverage includes representative cases for:

- A valid response containing bid amounts
- A valid response with no current bid
- An invalid negative favourite count
- Malformed currency values
- An invalid bidding time range

These tests complement the production-facing API and integration scenarios by validating the validator itself rather than relying on a live endpoint to exercise every branch.

#### UNIT-002 — Lot-Navigation Schema Validator

**Layer:** Unit / Schema  
**Priority:** P1  
**Intended CI target:** Pull Request  
**Status:** Implemented

##### Test intent

The lot-navigation runtime validator is also covered with deterministic in-memory payloads.

The unit coverage verifies:

- A valid navigation response
- Valid `null` adjacent lot identifiers
- Rejection of non-integer adjacent lot identifiers
- Rejection of invalid adjacent lot identifier types

The non-integer case exposed a real weakness in the original runtime validator, which was then tightened to require adjacent lot identifiers to be `integer | null`.

Both schema-validator unit suites are included in the deterministic `npm run quality` gate used by hosted CI.

### Production Safety

Only read-only endpoints observed during normal anonymous user interaction should be automated. The repository-wide production rules are defined in [ADR 004 — Production Test Guardrails](adr/004-production-test-guardrails.md).

The suite should not:

- Probe arbitrary undocumented services.
- Attempt to bypass authentication, authorization or anti-automation controls.
- Exercise state-changing API operations.
- Generate unnecessary traffic against the production environment.

The objective of API coverage is to validate high-value public behavior exposed during normal application usage, not to reverse-engineer or stress internal services.

## 13. Authenticated and State-Changing Testing

Creating a dedicated production test account was considered.

An authenticated user could enable scenarios involving:

- Authentication
- Favourites
- Account-specific behavior
- Preferences
- Additional user journeys

However, this would also introduce:

- Credential management
- Production state management
- Cleanup requirements
- Account lifecycle concerns
- Potential analytics side effects
- Recommendation side effects
- Potential notifications
- Additional security considerations

For the current assessment, anonymous and read-only automation provides a better risk-to-value ratio.

The suite should therefore avoid:

```text
Bidding
Purchasing
Favouriting / unfavouriting
Account creation
Persistent production data modification
```

These scenarios would become significantly more appropriate with an internal test account and controlled environment.

## 14. Test Data Strategy

Production auction data is dynamic.

Tests should therefore discover relevant values during execution rather than rely on fixed production records.

Example:

```gherkin
Scenario: Runtime lot data is used for consistency validation

  Given I have searched for "Train"
  When I inspect the second lot from the results
  Then I capture its runtime title and lot identifier

  When I open the selected lot
  Then the opened page should correspond to the captured lot
```

Volatile values such as:

- Bid state and amount
- Favourite count
- Remaining auction time
- Lot ID
- Lot title

should be validated according to their purpose.

Identity information may be compared across pages, while continuously changing values should normally be validated structurally rather than against fixed expected values.

API tests should follow the same principle.

Where possible, lot identifiers should be discovered from current application data rather than treated as permanent fixtures.

When production data must be referenced, assertions should validate structural and relational invariants rather than assume that a particular lot, auction position or bidding value will remain unchanged.

## 15. Cookie and Environment Handling

Cookie consent and locale handling are explicit environment preconditions for the E2E suite.

The maintained helper synchronizes on the observable Usercentrics blocking overlay, dismisses the observed public action when required, and verifies that the blocker is gone before continuing. Vendor-specific knowledge remains isolated in the support utility rather than leaking into Page Objects or business assertions.

Automation should:

- Synchronize on observable blocking state rather than page-load timing
- Avoid arbitrary waits and forced clicks
- Avoid hard-coded opaque Usercentrics storage values
- Verify that the blocker is gone before continuing
- Keep vendor-specific implementation knowledge isolated

The observed Usercentrics lifecycle and storage investigation are documented in [Usercentrics lifecycle](findings.md#usercentrics-lifecycle). The engineering reasoning for the maintained helper is summarized in [Usercentrics consent](approach.md#usercentrics-consent).

Extended exploration also surfaced late registration and NPS/CSAT prompts. These observations belong to [Late prompts](findings.md#late-prompts); no proactive handler is maintained because the current scenarios normally complete before those prompts interfere.

## 16. Reliability Strategy

The suite should prioritize deterministic execution and useful failure diagnostics.

Current principles include:

- No arbitrary sleeps
- Playwright auto-waiting
- Web-first assertions where appropriate
- Runtime discovery of dynamic production data
- Independent test scenarios
- Stable locator strategy
- Trace collection when retries are explicitly enabled
- Screenshots on failure
- Video retention on failure

Retries are disabled by default and should not be used to conceal unreliable tests.

If retries are introduced later for an approved production-facing CI job, they should be treated as additional diagnostic evidence; repeated failures must still be investigated as reliability problems.

Mandatory API requests include the HTTP status and response body in failure
messages when a non-success response is received.

This helps distinguish contract or business-rule failures from transient or
environmental HTTP failures without introducing automatic retries that could
hide instability.

### Accessibility execution readiness

Accessibility coverage retains a scoped 60-second timeout and each scan establishes meaningful page readiness before Axe executes. The scenarios remain logically independent rather than using serial mode.

The failure history and evidence behind this policy are summarized in [Accessibility readiness](approach.md#accessibility-readiness) and [Execution observations](findings.md#execution-observations).

### Internationalization execution budget

The language-persistence scenario uses a scoped 45-second timeout because it includes an additional locale transition before the search-to-lot journey. No global timeout increase or retry behavior is introduced for this case.

The observed timing behavior is captured in [Execution observations](findings.md#execution-observations).

### Production-conscious default parallelism

The default Chromium configuration uses at most two local workers with `fullyParallel: false`, while the dedicated cross-browser configuration uses one worker. These limits keep production traffic bounded and reflect the reliability behavior observed during the challenge.

See [Execution strategy](approach.md#6-execution-strategy), [Execution observations](findings.md#execution-observations), and [ADR 007](adr/007-cross-browser-execution-strategy.md) for the evidence and trade-offs behind these settings.

## 17. Execution Timing and Performance Considerations

Performance is an important quality characteristic, but the current environment is not suitable for meaningful performance testing.

Test execution occurs against an uncontrolled production environment and may be influenced by:

- Network latency
- CDN behavior
- Local machine load
- Browser startup
- Production traffic
- Server response time
- Geographic routing
- Third-party resources

For this reason, E2E duration should not be treated as a strict performance assertion.

For example, the suite should avoid assertions such as:

```ts
expect(duration).toBeLessThan(5000);
```

However, execution duration can still provide useful diagnostic information.

The framework may record values such as:

```text
Critical Search-to-Lot Journey: 6.42s
```

### Purpose of execution timing

Execution timing can help:

- Understand suite execution cost
- Observe unusually large changes over time
- Improve CI planning
- Identify scenarios that become unexpectedly slow
- Provide additional diagnostic information

These measurements should be treated as telemetry rather than performance test results.

No pass/fail threshold should initially be based on these timings.

### Performance testing

Load, stress and volume testing will not be performed against Catawiki production.

Generating artificial traffic could:

- Affect real customers
- Affect active auctions
- Create unnecessary infrastructure load
- Trigger security systems
- Resemble abusive or denial-of-service traffic

Meaningful performance testing would require explicit authorization, defined performance objectives and an appropriate controlled environment.

## 18. Test Steps and Reporting Readability

Tests should communicate their intent both through code and through generated reports.

Where useful, Playwright test steps can represent meaningful user or validation actions.

For example:

```text
Critical Search-to-Lot Journey

✓ Open Catawiki landing page
✓ Search for "Train"
✓ Select second lot
✓ Capture selected lot identity
✓ Open selected lot
✓ Validate lot consistency
✓ Retrieve auction details
```

This improves:

- Report readability
- Failure diagnosis
- Trace navigation
- Communication of test intent

Steps should represent meaningful behavior rather than wrapping every individual Playwright command.

## 19. Known Execution Constraint

Production-facing execution is constrained by the public Catawiki edge layer.

Headed local browser execution loaded the application successfully, while headless Chromium and a read-only request from a GitHub-hosted runner could receive `Access Denied` / `403 Forbidden`.

The maintained suite does not attempt to identify, spoof, or bypass those controls. Production-facing browser and API scenarios therefore remain outside the current GitHub-hosted workflow.

The evidence is recorded in [Headless and hosted access](findings.md#headless-and-hosted-access). The resulting engineering decision is explained in [Hosted CI strategy](approach.md#7-hosted-ci-strategy).

## 20. CI/CD Strategy

The CI strategy should balance useful automated feedback with the constraints of testing against the public Catawiki production environment.

The initial GitHub Actions workflow was intentionally kept small so that the execution environment could be validated before introducing broader production-facing coverage.

### Pull Request Pipeline

Current GitHub-hosted coverage:

```text
Dependency installation
        ↓
Quality gate
├── TypeScript type check
├── ESLint
├── Prettier format check
└── Schema validator unit tests
        ↓
Playwright test discovery
├── Default Chromium configuration
└── Cross-browser smoke configuration
```

The hosted workflow intentionally stops at deterministic repository validation and Playwright discovery. Production-facing API and browser scenarios are excluded because of the observed edge restriction rather than worked around.

The underlying observation is documented in [Headless and hosted access](findings.md#headless-and-hosted-access), and the design rationale is described in [Hosted CI strategy](approach.md#7-hosted-ci-strategy).

With an approved execution environment that can access the production application normally, the intended pull-request coverage could expand to include:

```text
TypeScript type check
        ↓
High-value API checks
        ↓
Critical Chromium smoke
        ↓
Negative search scenario
        ↓
Accessibility regression reporting
```

The pull-request pipeline should prioritize:

- Reliability
- Fast feedback
- Useful failure diagnostics
- Production safety
- High-value regression detection

### Nightly Pipeline

With an appropriate execution environment, broader scheduled coverage could include:

```text
Broader E2E suite
        ↓
Alternate view-mode + representative mobile coverage
        ↓
Cross-browser execution
        ↓
Internationalization
        ↓
Edge scenarios
        ↓
Optional visual validation
```

The nightly pipeline can accept a larger execution cost in exchange for broader confidence.

### Important constraint

Production-facing CI requires an approved execution environment accepted by the Catawiki edge layer. Until that exists, the current GitHub-hosted pipeline provides deterministic repository validation and Playwright discovery, while live production scenarios remain suitable for controlled local execution.

See [Headless and hosted access](findings.md#headless-and-hosted-access) for the observed restriction and [Approved CI execution environment](future-opportunities.md#highest-value-next-step) for the next infrastructure step.

## 21. Cross-Browser Strategy

Cross-browser coverage is implemented through Playwright projects while reusing the existing critical smoke scenario.

The supported validation matrix is:

```text
Chromium
Firefox
WebKit
```

The default Playwright configuration remains Chromium-only and is used for normal suite execution. It uses at most two local workers with `fullyParallel: false` so production traffic remains bounded.

A dedicated cross-browser configuration runs only the `@smoke` scenario across all three browser engines with a single worker.

This results in two distinct execution modes:

```text
Default suite
└── Chromium
    └── Full implemented suite
        └── 2 local workers, fullyParallel: false
```

```text
Cross-browser validation
├── Chromium
├── Firefox
└── WebKit
    └── Critical @smoke journey only
        └── 1 worker
```

The separation avoids multiplying API, integration, negative, and accessibility scenarios across browsers when those tests do not provide equivalent browser-compatibility value.

Single-worker execution and the scoped 45-second cross-browser timeout are evidence-based reliability decisions rather than general framework defaults. The detailed execution history is kept in [Execution observations](findings.md#execution-observations), and the durable strategy is recorded in [ADR 007](adr/007-cross-browser-execution-strategy.md).

With an approved production-facing CI environment, the cross-browser smoke configuration would be a suitable candidate for scheduled execution.

## 22. Test Tags

Tags allow the same suite to support different execution strategies without duplicating tests.

Implemented scenario tags include:

```text
@smoke
@e2e
@negative
@accessibility
@i18n
@api
@integration
@mobile
@view-mode
```

`@visual` remains a potential tag for `VIS-001` if visual regression coverage is implemented. A dedicated `@unit` tag is intentionally unnecessary because deterministic validator tests already have their own directory and `npm run test:unit` command.

Example usage:

```text
PR
→ @smoke + selected high-value scenarios

Nightly
→ broader regression suite
```

Tagging should remain simple.

A tag should exist because it supports a real filtering or execution need, not merely to categorize every possible characteristic of a test.

## 23. Failure Diagnostics and Reporting

A failed automated test should provide enough information to begin investigation without immediately reproducing the issue locally.

Current or planned diagnostics include:

- Playwright HTML report
- Screenshots on failure
- Video retained on failure
- Trace collection when retries are explicitly enabled
- Named test steps
- Runtime values where useful
- Test execution duration

A CI failure investigation should ideally follow a flow similar to:

```text
Test fails in CI
        ↓
Open workflow result
        ↓
Inspect Playwright report
        ↓
Identify failed step
        ↓
Inspect screenshot / video
        ↓
Inspect trace when available
```

Relevant Playwright reports and diagnostic files should be published as CI artifacts when appropriate.

## 24. Visual Evidence vs Visual Regression

Validating that an expected image exists is different from visual regression testing.

For example:

```gherkin
Scenario: Lot contains a visible primary image

  Given I have opened a lot
  Then the lot should display a visible primary image
```

This is a functional UI assertion.

Visual regression instead compares rendered appearance against a known baseline.

The two techniques should not be treated as equivalent.

### Image content recognition

Using image recognition to determine whether the lot image actually depicts a train was considered.

Although technically possible, it is currently rejected because it would introduce:

- Model or library dependency
- Classification thresholds
- False positives and false negatives
- Additional complexity
- Nondeterministic behavior
- Limited additional confidence for the assignment

The technique would therefore represent unnecessary over-engineering for the current scope.

## 25. Mocking and Network Stubbing

Playwright can intercept and mock network responses.

However, mocking production responses without knowledge of Catawiki's internal API contracts would result in the test validating assumptions introduced by the test itself.

For example, stubbing a favourite count would prove that the UI reacts to the mocked payload, but not necessarily that the real Catawiki system behaves correctly.

Network mocking is therefore currently deferred.

With access to documented contracts or internal service definitions, mocking could become valuable for:

- Rare application states
- Backend failures
- Deterministic edge cases
- Error handling
- State combinations that are difficult to reproduce naturally

## 26. Scenarios Rejected for the Current Scope

Some technically possible scenarios were consciously rejected.

### Production bidding

Rejected because it could directly affect a real auction and create financial consequences.

### Production purchasing

Rejected because it creates real transactional state.

### Favourite manipulation

Rejected because it modifies production state and may generate secondary effects such as analytics or recommendation signals.

### Stress and load testing

Rejected because production traffic should not be intentionally increased for an external assessment.

### Arbitrary internal API probing

Rejected because discovering or probing arbitrary undocumented services would exceed the intended scope of the assessment.

This does not exclude read-only JSON endpoints naturally observed during normal anonymous application usage. Such endpoints may be considered when they provide clear testing value, require no access-control bypass and can be exercised safely with minimal production traffic.

### Clone of the Catawiki pages

Creating a controlled copy of the relevant Catawiki pages would allow broader testing freedom.

However, the resulting suite would primarily validate the recreated application rather than Catawiki itself.

This would reduce the relevance of the exercise and remove many of the real-world constraints that make the assessment valuable.

For this reason, the production application remains the system under test.

## 27. Out of Scope / Future Opportunities

With access to an internal staging environment, documented services and controlled test data, the strategy could be expanded significantly. This section records the test-plan view of deferred scope; the broader evolution path and prioritization are maintained in [Future Opportunities](future-opportunities.md).

Potential future coverage includes:

- Authenticated user journeys
- Deterministic test accounts
- Controlled data creation and cleanup
- Bidding workflows
- Purchase workflows
- Authenticated API testing
- State-changing API workflows
- Broader API contract coverage using documented internal specifications
- Deeper UI/API consistency testing
- Network mocking
- Service virtualization
- Failure injection
- Performance testing
- Load testing
- Broader internationalization coverage
- Broader mobile and tablet device coverage beyond the representative iPhone profile
- Broader search-result view-mode and preference-persistence coverage
- Search sorting and filtering state validation
- Deeper visual regression coverage
- Security testing with explicit authorization

These areas are intentionally documented rather than artificially forced into the current production-based assessment.

## 28. Documentation Strategy

The repository documentation is intentionally split by responsibility so that this test plan can remain comprehensive without becoming the source of truth for every implementation detail.

For a reviewer-oriented navigation map, see the [Documentation Guide](README.md).

- [Root README](../README.md) — project entry point, installation, commands, reports, current CI behavior and key limitations.
- **This test plan** — scenario scope, priority, status, intended execution context, candidate coverage and rejected/deferred testing ideas.
- [Engineering Approach](approach.md) — how exploration, architecture and reliability decisions evolved.
- [Production Findings and Observations](findings.md) — evidence observed from the public Catawiki application, including environment, API, accessibility, responsive and execution behavior.
- [ADRs](adr/) — durable architectural decisions and their trade-offs.
- [Future Opportunities](future-opportunities.md) — intentionally deferred improvements and what additional internal access or infrastructure would enable.
- [API Response Samples](api-samples/README.md) — sanitized examples of observed read-only payloads used for documentation context only.

The documents should complement each other rather than repeat complete explanations. Where this plan depends on production evidence or durable architectural reasoning, it links to the canonical supporting document while retaining the scenario-level decision here.

## 29. AI-Assisted Development

AI-assisted development may be documented transparently as part of the project.

AI can support activities such as:

- Brainstorming
- Reviewing test strategy
- Discussing architecture
- Reviewing implementation alternatives
- Improving documentation
- Debugging assistance

AI-assisted browser exploration was also used to support network reconnaissance and identify read-only application behavior worth evaluating for API coverage.

Playwright Codegen was also used as an exploratory locator-discovery tool.

Generated suggestions should not be treated as authoritative.

Final decisions, code behavior and test results must be manually understood, reviewed and validated.

The responsibility for the final implementation remains with the developer.

## 30. Completion Strategy

The test plan is intentionally broader than the implementation commitment.

The goal of the assessment is not to complete every scenario listed in this document.

Implementation should follow approximately:

```text
P0 stability
    ↓
P1 meaningful additional coverage
    ↓
Reliability and diagnostics
    ↓
CI/CD integration
    ↓
P2 scenarios if time remains
    ↓
Experimental ideas only if they provide clear value
```

A smaller reliable suite with clear reasoning is preferred over a large suite containing redundant, fragile or artificial tests.

The final implementation should demonstrate not only which testing techniques can be used, but also why each implemented test earns its place in the suite.
