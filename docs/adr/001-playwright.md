# ADR 001 — Playwright

## Context

The project needs to test a real web application involving navigation, search, dynamic pages, and potentially API-level validation.

## Decision

Use Playwright with TypeScript.

## Reasons

- Native Chromium, Firefox and WebKit support
- Auto-waiting
- Web-first assertions
- Tracing
- Screenshots and video
- API testing capabilities
- Parallel execution
- CI/CD integration
- TypeScript type safety


## Alternatives considered

- Cypress
- Selenium

## Decision Bias

The intent of this challenge is to showcase my technical skills, so I intentionally leaned toward a technology I am already comfortable with. The fact that Playwright is also the current framework used at Catawiki reinforced and ultimately finalized this decision.

## Trade-offs

Playwright provides strong browser automation and API testing capabilities, but it is not intended to replace specialized performance or load-testing tools.