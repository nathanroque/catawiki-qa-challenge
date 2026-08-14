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