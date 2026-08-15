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

These behaviors were treated as environmental concerns rather than being hidden through longer timeouts or arbitrary waits.

The headless behavior remains an item to investigate before introducing CI execution.

## 6. What now?

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

The automation should behave as a normal visitor and avoid actions that could affect real auctions or users. In particular, no bids, purchases, favourites, account creation, or other state-changing actions should be performed unless explicitly required or reversable.

**Avoid sensitive data**

The suite should not collect, persist, or expose personal, authentication, payment, or other sensitive information.

**Prefer caution over additional coverage**

A technically interesting test is not automatically a valuable test. Any additional scenario should provide meaningful quality information without creating unnecessary risk to the production environment.

With these constraints established, the remaining scenarios can be selected using risk, value, execution cost, and maintainability as the main criteria.

## 8. Test Plan

The expanded test plan will be risk-based and focus on scenarios that provide additional confidence or demonstrate a distinct testing technique without duplicating coverage unnecessarily.

## 9.API reconnaissance and first API test

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