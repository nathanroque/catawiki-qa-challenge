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

```ts
page.getByRole('combobox', { name: 'Search for brand, model,' })