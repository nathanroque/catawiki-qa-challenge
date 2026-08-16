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

- a current bid exists;
- the value follows an expected monetary format;
- the selected lot identity remains consistent after navigation.


### No arbitrary waits
Tests should rely on Playwright auto-waiting and web-first assertions rather than fixed `waitForTimeout()` calls.


### Tests should be independently executable
No test should depend on another test being executed first.


### Production interactions must remain non-destructive
The production guardrails defined in ADR 004 apply to all scenarios in this plan.


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
| ID | Scenario | Layer | Priority | CI Target | Status |
|---|---|---|---|---|---|
| E2E-001 | Search `Train` → open second lot → validate lot details and identity | E2E / Smoke | P0 | PR | Implemented |
| E2E-002 | Nonsense search → no exact results message + related-object fallback | E2E / Negative | P1 | PR | Implemented |
| API-001 | Second Train search lot has consistent bidding API state | UI/API Integration + Contract | P1 | PR | Implemented |
| API-002 | Lot navigation remains internally consistent | API + Contract | P1 | PR | Implemented |
| A11Y-001 | Landing page has no unexpected serious or critical accessibility violations | Accessibility | P1 | Scheduled / Report | Implemented |
| A11Y-002 | Search results page has no unexpected serious or critical accessibility violations | Accessibility | P1 | Scheduled / Report | Implemented |
| A11Y-003 | Lot details page has no unexpected serious or critical accessibility violations | Accessibility | P1 | Scheduled / Report | Implemented |
| XB-001 | Critical journey runs across Chromium, Firefox and WebKit | Cross-browser | P1 | Nightly | Implemented |
| E2E-003 | Search handles benign special characters gracefully | E2E / Edge | P2 | Nightly | Candidate |
| I18N-001 | Selected language persists across the critical journey | Internationalization | P2 | Nightly | Implemented |
| I18N-002 | Sampled interface text predominantly matches selected language | Internationalization | Experimental | Nightly | Candidate |
| VIS-001 | Stable UI region matches approved visual baseline | Visual | P2 | Nightly | Candidate |


## 6. P0 Coverage
### E2E-001 — Critical Search-to-Lot Journey
**Layer:** E2E / Smoke  
**Priority:** P0  
**CI target:** Pull Request  
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

The test validates their existence, structure and consistency instead of comparing them against hard-coded production values.


#### Assignment output
The scenario records:

```text
title
favourites
current bid
```

These values are informational output rather than fixed expected data.


## 7. P1 Coverage
### E2E-002 — Search With No Exact Results
**Layer:** E2E / Negative  
**Priority:** P1  
**CI target:** Pull Request  
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
**CI target:** Scheduled / Report  
**Status:** Implemented

```gherkin
Scenario: Landing page has no unexpected high-severity accessibility violations

  Given I am on the Catawiki landing page
  When an automated accessibility scan is executed
  Then no unexpected serious or critical accessibility violation rules should be found
```

#### Test intent

The landing page is scanned with `@axe-core/playwright` to provide an automated accessibility regression signal.

The initial scan was intentionally configured to fail on any `serious` or `critical` finding. Repeated exploratory and full-suite execution identified a known set of existing high-severity axe rule IDs in the production application.

Because this project does not control the Catawiki production code, leaving the test permanently failing on those existing findings would reduce its value as a regression signal. The implemented scenario therefore uses an explicit known-issue baseline and fails when a new high-severity violation rule appears outside that baseline.

The baseline is maintained by axe violation rule ID rather than exact affected-node count. The exact set present in an individual execution and the number of affected nodes may vary because the production page contains dynamic and conditionally rendered content. A known rule is therefore not required to appear in every execution.

Known findings remain visible in the test output for diagnostic and review purposes. The baseline is intended to make existing findings explicit, not to classify them as acceptable product behavior.

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
**CI target:** Scheduled / Report  
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

Repeated exploratory execution identified the following known high-severity
rule IDs:

```text
button-name
color-contrast
svg-img-alt
```

`button-name` and `svg-img-alt` were consistently observed during the initial
isolated executions. `color-contrast` was additionally observed during
full-suite execution on dynamic lot countdown content.

The baseline therefore represents rule categories confirmed within this page
context rather than rules that must appear in every execution.

### A11Y-003 — Lot Details Accessibility

**Layer:** Accessibility  
**Priority:** P1  
**CI target:** Scheduled / Report  
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

Repeated exploratory execution identified the following known high-severity
rule IDs:

```text
button-name
color-contrast
link-name
scrollable-region-focusable
svg-img-alt
```

`button-name`, `color-contrast`, `scrollable-region-focusable`, and
`svg-img-alt` were observed across all exploratory executions.

`link-name` was observed in one execution and was not reproduced in subsequent
isolated scans. Because the finding was confirmed within the lot-details
context, it remains part of the known baseline.

Affected-node counts varied between executions, so the baseline remains based
on rule IDs rather than exact counts.

#### Accessibility scope

Automated accessibility testing provides a useful regression signal but does not prove complete WCAG compliance.

Manual accessibility analysis remains outside the scope of this assignment.

Accessibility scans currently act as reporting and regression checks rather than strict zero-violation PR gates because the production environment contains pre-existing automated findings outside the scope of this project.


### XB-001 — Cross-Browser Critical Journey

**Layer:** Cross-browser E2E  
**Priority:** P1  
**CI target:** Nightly  
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

The critical journey completed successfully when Chromium, Firefox, and WebKit were executed individually.

When the broader multi-project execution was allowed to run concurrently, Firefox and WebKit experienced intermittent timeouts in different parts of the journey, including navigation completion and a late Usercentrics overlay intercepting interaction.

The same configured execution completed successfully with a single worker.

Cross-browser smoke execution is therefore intentionally serialized rather than relying on higher global timeouts or retries to mask concurrency-related instability against the production environment.


## 8. P2 / Stretch Coverage
### E2E-003 — Special Character Search
**Layer:** E2E / Edge  
**Priority:** P2  
**CI target:** Nightly  
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


## 9. Internationalization Coverage
### I18N-001 — Language Selection and Persistence

**Layer:** Internationalization / E2E  
**Priority:** P2  
**CI target:** Nightly  
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
**CI target:** Nightly  
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
**CI target:** Nightly  
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

Contract validation is intentionally limited to fields relevant to the implemented scenarios, while behavioral and cross-response assertions remain in the tests.

#### API-001 — Bidding State Contract
**Layer:** UI/API Integration + Contract  
**Priority:** P1  
**CI target:** Pull Request  
**Status:** Implemented

```gherkin
Scenario: Second Train search lot has consistent bidding API state

  Given I am on the Catawiki landing page
  When I search for "Train"
  And I identify the second lot from the search results
  And I request the bidding state for that lot
  Then the bidding response should contain the selected lot
  And the lot should have a valid auction identifier
  And its favourite count should be a non-negative integer
  And its bidding period should be structurally valid
```

##### Test intent
This scenario validates a read-only JSON contract used by the public application.

Assertions should focus on stable properties such as identifiers, types, timestamp ordering and non-negative counters rather than exact live auction values.

#### API-002 — Lot Navigation Consistency
**Layer:** API + Contract  
**Priority:** P1  
**CI target:** Pull Request  
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

### Production Safety
Only read-only endpoints observed during normal anonymous user interaction should be automated.

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

- Current bid
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

The primary journey should navigate directly to the English locale.

If the consent dialog is present, the automation should dismiss it through the user-facing decline/continue-without-accepting action and verify that the dialog is actually removed before interacting with the application.

Where handling is required, automation should:

- Interact through user-facing controls
- Avoid DOM implementation details where possible
- Avoid arbitrary waits
- Avoid unnecessary consent
- Keep environment setup deterministic

Reusable handling may later be moved into common test setup if repetition justifies the abstraction.

Cookie handling should support the tests rather than become an unnecessary framework of its own.

Repeated full-suite execution also showed that the consent component may finish
initializing after the initial page-navigation handling has completed.

For interactions that can be blocked by a late consent overlay, the environment
support utility may therefore be invoked again immediately before the relevant
interaction.

This is intentionally preferred over forcing Playwright clicks through the
overlay because the goal is to reproduce a valid user interaction rather than
bypass an active UI layer.


## 16. Reliability Strategy
The suite should prioritize deterministic execution and useful failure diagnostics.

Current principles include:

- No arbitrary sleeps
- Playwright auto-waiting
- Web-first assertions where appropriate
- Runtime discovery of dynamic production data
- Independent test scenarios
- Stable locator strategy
- Trace collection on retry
- Screenshots on failure
- Video retention on failure

Retries should not be used to conceal unreliable tests.

A retry may be useful in CI for additional diagnostic information, but repeated failures should still be investigated as reliability problems.

Mandatory API requests include the HTTP status and response body in failure
messages when a non-success response is received.

This helps distinguish contract or business-rule failures from transient or
environmental HTTP failures without introducing automatic retries that could
hide instability.

### Accessibility execution isolation

Repeated full-suite execution showed that running multiple full-page axe scans
concurrently could increase execution time enough to exceed the default test
timeout.

Accessibility scenarios are therefore executed serially and use a dedicated
60-second timeout while the remainder of the suite retains normal parallel
execution.

This keeps the broader suite fast while isolating the higher execution cost of
full-page accessibility analysis.

The timeout adjustment is scoped to accessibility tests rather than applied
globally because unrelated scenarios have not demonstrated a general need for
a longer execution budget.

### Internationalization execution budget

The language-persistence scenario performs an additional locale transition before executing the search-to-lot journey.

Repeated full-suite execution showed that the scenario could intermittently exceed the default 30-second timeout while still progressing through valid localized application states.

The I18N scenario therefore uses a scoped 45-second timeout.

The adjustment remains local to the scenario because the rest of the suite has not demonstrated a general need for a larger execution budget.

Retries and global timeout increases were intentionally avoided.

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
During local development, different behavior was observed between browser execution modes.


### Headed Chromium
The Catawiki application loads and the critical journey executes successfully.


### Headless Chromium
The production edge layer currently responds with an `Access Denied` page during headless execution.

This behavior is considered an environmental or infrastructure constraint rather than a functional product failure.

The suite should not attempt to circumvent anti-automation or production security controls.

Before unattended CI execution against production is enabled, an appropriate execution strategy must be identified.

### GitHub-hosted runners

The initial GitHub Actions execution confirmed an additional production-environment constraint.

Repository setup, dependency installation, and TypeScript validation completed successfully on the GitHub-hosted Ubuntu runner. However, the read-only production API scenario received a `403 Forbidden / Access Denied` response from the production edge layer.

The current hosted workflow therefore does not execute production-facing API or browser scenarios.

This restriction should not be worked around through spoofed client behavior, arbitrary retries, or attempts to bypass the production edge controls.


## 20. CI/CD Strategy

The CI strategy should balance useful automated feedback with the constraints of testing against the public Catawiki production environment.

The initial GitHub Actions workflow was intentionally kept small so that the execution environment could be validated before introducing broader production-facing coverage.

### Pull Request Pipeline

Current GitHub-hosted coverage:

```text
Dependency installation
        ↓
TypeScript type check
```

The initial workflow also attempted to execute the pure read-only API scenario.

Repository checkout, dependency installation, and TypeScript validation completed successfully, but the production API request received a `403 Forbidden / Access Denied` response from the Catawiki production edge layer.

Production-facing API and browser scenarios are therefore intentionally excluded from the current GitHub-hosted workflow.

The workflow should not attempt to bypass this restriction through altered client behavior, spoofed headers, arbitrary retries, or other anti-automation workarounds.

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

Actual automated execution against the production site depends on using an execution environment accepted by the Catawiki production edge layer.

Both local headless browser execution and the initial GitHub-hosted API execution have received `Access Denied` responses.

The suite should not attempt to circumvent these production security controls.

The current GitHub-hosted pipeline therefore provides deterministic static validation, while production-facing automated scenarios remain suitable for controlled local execution or a future approved CI environment.


## 21. Cross-Browser Strategy

Cross-browser coverage is implemented through Playwright projects while reusing the existing critical smoke scenario.

The supported validation matrix is:

```text
Chromium
Firefox
WebKit
```

The default Playwright configuration remains Chromium-only and is used for normal suite execution.

A dedicated cross-browser configuration runs only the `@smoke` scenario across all three browser engines with a single worker.

This results in two distinct execution modes:

```text
Default suite
└── Chromium
    └── Full implemented suite
```

```text
Cross-browser validation
├── Chromium
├── Firefox
└── WebKit
    └── Critical @smoke journey only
```

The separation avoids multiplying API, integration, negative, and accessibility scenarios across browsers when those tests do not provide equivalent browser-compatibility value.

Single-worker execution is deliberate. Concurrent multi-browser execution against the production application produced intermittent timeouts, while isolated browser runs and the serialized cross-browser execution completed successfully.

With an approved production-facing CI environment, the cross-browser smoke configuration would be a suitable candidate for scheduled execution.


## 22. Test Tags
Tags can allow the same suite to support different execution strategies without duplicating tests.

Current and potential tags include:

```text
@smoke
@e2e
@negative
@accessibility
@i18n
@visual
@api
@integration
```

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
- Trace collection on retry
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
With access to an internal staging environment, documented services and controlled test data, the strategy could be expanded significantly.

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
- Deeper visual regression coverage
- Security testing with explicit authorization

These areas are intentionally documented rather than artificially forced into the current production-based assessment.


## 28. Documentation Strategy
Different documentation files serve different purposes in the project.


### README
Explains how to consume the project:

- What the project is
- Installation
- Execution
- Test commands
- Architecture overview
- Reports
- CI/CD
- Current limitations


### Testing Approach
Explains how the solution evolved:

- Initial exploration
- Locator discovery
- Codegen usage
- Locator refinement
- Refactoring decisions
- Quality expansion reasoning


### Test Plan
Explains:

- What should be tested
- Why the scenarios were selected
- Their priority
- Their execution strategy
- What was considered but intentionally deferred


### ADRs
Record architectural decisions and their trade-offs.

Current examples include:

- Playwright selection
- Test layering
- Page Object Model
- Production testing guardrails

The documents should complement each other rather than repeat the same information.


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