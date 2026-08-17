# ADR 002 — Test Layering

## Context

The suite needs confidence across user behavior, selected public APIs, cross-layer consistency, runtime response shape, and accessibility without multiplying every check through the browser.

## Decision

Use the smallest layer that directly exercises the relevant risk.

Implemented layers are:

- E2E for observable customer journeys;
- direct API testing for read-only backend relationships;
- UI/API integration for shared live business state;
- focused runtime response validation for consumed fields;
- deterministic unit tests for validator behavior;
- automated accessibility regression signals.

Cross-browser and responsive execution reuse the E2E journey rather than forming separate duplicate implementations.

Visual regression remains a candidate, not an implemented layer.

## Responsibilities

- Tests own business expectations and cross-response relationships.
- Page Objects own page-specific UI behavior and selectors.
- The API client owns request construction.
- Runtime validators own selected response-shape and value checks.
- Axe tests own automated rule-category regression signals, not complete accessibility compliance.

Scenario priority and status belong in the [test plan](../test-plan.md).

## Alternatives considered

- Put every assertion in E2E tests: rejected because it increases execution cost and obscures narrower failures.
- Require one test of every possible layer: rejected because tools should follow risk rather than a checklist.
- Mock production APIs for the maintained integration journey: rejected because invented responses would not validate live UI/API consistency.

## Consequences

The suite contains several test types, but each must provide distinct confidence. New layers should not be introduced without a concrete risk that the existing architecture cannot express proportionately.
