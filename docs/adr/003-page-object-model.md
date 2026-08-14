# ADR 003 — Page Object Model

## Context

The initial critical journey was implemented directly in the test file to validate the behavior before introducing abstractions.

Once the flow was stable, repeated page-specific interactions and selectors became clear enough to justify separating page knowledge from test expectations.

## Decision

Use small Page Objects to encapsulate page-specific interactions and selectors.

The responsibilities are divided as follows:

- `SearchPage` handles search interactions.
- `SearchResultsPage` represents search results and lot selection.
- `LotPage` exposes information and interactions from the lot details page.

Tests remain responsible for business expectations and assertions.

## Reasons

- Reduces duplication of selectors and page interactions
- Improves readability of test scenarios
- Centralizes maintenance when page structure changes
- Encourages reuse across future scenarios
- Keeps tests focused on expected behavior rather than implementation details

## Alternatives considered

### Keep all interactions inside test files

This keeps simple tests very explicit, but would introduce duplication as the suite grows.

### Create generic helper functions

Helpers could reduce duplication, but they would not represent the domain and page structure as clearly as Page Objects.

## Trade-offs

Page Objects introduce additional files and abstraction.

Overly large or generic Page Objects can hide test intent and become difficult to maintain, so they should remain small and focused on page-specific responsibilities.

Assertions should generally remain in the tests unless they represent page readiness or another page-specific invariant.