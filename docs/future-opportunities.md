# Future Opportunities

These items are deliberately outside the current submission. They should be reconsidered only when risk, authorization, environment, and maintenance cost justify them.

Current coverage and status remain in the [test plan](test-plan.md); current operational constraints remain in the [README](../README.md#key-constraints).

## Highest-value next step

Provide an approved execution environment or internal staging system with controlled accounts and disposable auction data. This would unlock more value than adding further anonymous production variants.

With that foundation, prioritize:

1. Critical authenticated and transactional workflows, including safe favourite, bidding, and purchase lifecycle coverage.
2. Explicit test-data creation, ownership, cleanup, and expiry.
3. Provider-owned API specifications and compatibility verification where deployment coupling matters.
4. Functional CI execution with useful artifacts and clear failure ownership.

## CI evolution

An approved pipeline could layer feedback by cost:

```text
Pull request
  static checks + validator/unit tests
  → selected API/component checks
  → critical Chromium smoke

Main or scheduled
  broader E2E
  → accessibility and I18N
  → cross-browser smoke
```

Publish HTML/JUnit results and failure diagnostics only when production-facing tests actually execute. A future manual workflow could parameterize browser, locale, environment, and scope. The existing `SEARCH_KEYWORD` override is a local exploratory convenience, not a substitute for controlled test data or a complete parameterized pipeline.

## Quality coverage

### Accessibility

Extend beyond Axe with keyboard navigation, focus order, screen-reader evaluation, zoom, and reflow. Internal issue ownership and stable component fixtures could support finer-grained baselines.

### Visual regression

Target stable, application-owned components with deterministic data. Broad screenshots of auction cards would be noisy because images, prices, countdowns, and seller content change continuously.

### Performance and security

Define authorization, environment, traffic budgets, and measurable objectives first. Do not infer performance from uncontrolled E2E duration or treat public endpoint observations as vulnerabilities.

### Browser and device coverage

Use support policy, analytics, and defect history to select additional browsers, real Safari, Android, tablet, or responsive breakpoints. Do not multiply the full suite across a matrix without a risk signal.

### Search and preference coverage

Pagination, additional search boundaries, and broader view-mode persistence may be useful independent workflows. Add them only when they validate behavior not already covered by the critical and negative journeys.

## Framework evolution

Custom fixtures, reusable header components, or typed schema tooling should be introduced only when repeated setup, contract breadth, or ownership creates a concrete maintenance problem. The current suite does not require a base-page hierarchy, dependency-injection layer, Cucumber, dashboard, or separate unit-test runner.

## Ideas intentionally not prioritized

- Random lot selection: reduces reproducibility without adding a clear product risk.
- Image recognition: seller-provided imagery is not a reliable oracle for the search engine's business semantics.
- Execution video as a submission artifact: failure video already exists; a curated demo is optional presentation material, not test evidence.
- Pre-commit hooks: optional developer ergonomics; hosted quality gates are the enforceable source of truth.
- A testing dashboard: unjustified for the suite size and absent functional CI execution.
- Fail-fast tuning: low value while the suite is small and independent diagnostic coverage is preferred.
