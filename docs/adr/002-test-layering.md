## Context

The test suite should balance confidence, execution cost, maintainability, and feedback speed.

## Decision

The automation strategy may include the following test layers:

- E2E
- API
- Contract
- Integration
- Accessibility
- Visual

## Responsibilities

- E2E covers critical user journeys
- API covers behavior more cheaply and quickly
- Contract detects structural changes
- Integration validates consistency between layers
- Accessibility covers semantic and accessibility issues
- Visual testing covers UI regressions in stable regions

## CI strategy

Not every test type will run on every CI event.