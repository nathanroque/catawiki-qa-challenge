# ADR 005 — Risk-Based Test Planning

## Context

The assignment encourages broader quality thinking beyond the minimum requested scenario, including maintainability, reliability, scalability, performance and CI/CD integration.

At the same time, the system under test is a real production environment and the time available for the challenge is limited.

A large number of technically possible tests could be implemented, but maximizing test count would not necessarily maximize confidence or demonstrate good engineering judgment.

## Decision

The test suite will follow a risk-based and value-oriented planning strategy.

Test scenarios will be prioritized according to:

- Quality risk
- Confidence gained
- Execution cost
- Maintainability
- Production safety
- CI/CD suitability
- Relevance to the assignment

Scenarios are classified as:

- **P0** — Critical coverage required for the core assignment
- **P1** — High-value additional coverage
- **P2** — Stretch coverage
- **Experimental** — Interesting techniques that should not act as primary test oracles
- **Deferred** — Valuable under different conditions but intentionally not implemented in the current environment

The test plan may therefore describe more scenarios than are ultimately implemented.

## Scenario Representation

Behavioral test scenarios in the test plan will be written using Gherkin-style `Given / When / Then` syntax.

The intent is not to introduce a full BDD framework or Cucumber dependency.

Gherkin is used only as a documentation format because it:

- Keeps scenarios readable for both technical and non-technical readers
- Separates preconditions, actions and expected behavior clearly
- Makes the intent of each test easier to understand
- Maps naturally to Playwright test steps and reporting
- Helps keep the test plan focused on behavior rather than implementation details

The automated tests themselves remain implemented directly with Playwright Test.

For example:

```gherkin
Scenario: User can search for Train and inspect the second lot

  Given I am on the Catawiki landing page
  When I search for "Train"
  And I select the second lot from the search results
  Then the selected lot page should open successfully
  And the opened lot should match the lot selected from the search results
```

This decision intentionally avoids introducing Cucumber or another BDD execution layer solely for the purpose of matching the documentation format.

## Reasons

### Avoid test-count-driven development

Adding tests only to increase the size of the suite can introduce redundant coverage, longer execution times and higher maintenance cost without providing proportional confidence.

### Focus effort where it provides the most value

A small number of carefully selected scenarios can cover substantially different risks more effectively than many minor variations of the same behavior.

For example, a successful search and a zero-results search provide more distinct information than testing the same successful search with several variations of letter casing.

### Respect production constraints

Some useful testing techniques, such as load testing, state-changing workflows or aggressive boundary testing, are inappropriate against the current production environment.

### Support CI/CD design

Prioritization allows different levels of coverage to be assigned to different pipeline stages.

For example:

- P0 and selected P1 scenarios can provide fast pull-request feedback.
- Broader browser, internationalization and edge coverage can run on scheduled pipelines.

### Keep the solution proportional to the assignment

The objective is to demonstrate broad software quality knowledge without over-engineering the solution.

## Alternatives Considered

### Implement every identified scenario

This would demonstrate breadth but would increase execution time, maintenance cost and duplication.

It could also encourage low-value or inappropriate tests simply because they are technically possible.

### Implement only the assignment scenario

This would satisfy the minimum functional requirement but would not demonstrate the broader quality and CI/CD considerations explicitly encouraged by the assignment.

### Prioritize purely by test layer

For example, requiring at least one E2E, API, accessibility, visual and contract test.

This was rejected because the availability of a testing technique does not automatically make it appropriate for the current system or environment.

Testing layers should be selected because they provide useful confidence, not to satisfy a checklist.

## Trade-offs

A risk-based strategy involves judgment.

Two engineers may reasonably assign different priorities to the same scenario.

Some lower-priority defects may also remain uncovered because implementation effort is intentionally concentrated on higher-value risks.

To make these decisions transparent, considered, implemented, deferred and rejected scenarios are documented in the test plan.

## Consequences

The implementation will prioritize:

1. Stability of the critical P0 journey
2. Meaningfully different P1 quality signals
3. Reliability and diagnostics
4. CI/CD integration
5. P2 coverage when time permits
6. Experimental techniques only when they provide clear additional value

Exploratory evidence may change the selected testing layer or priority of an existing scenario.

For example, if normal user interaction reveals a stable, read-only JSON contract, API coverage may become higher value than previously assumed.

Such changes should be reflected in the test plan while preserving the same risk, maintainability and production-safety criteria.

A test should earn its place in the suite through the confidence it provides rather than simply demonstrating that a particular tool or technique can be used.