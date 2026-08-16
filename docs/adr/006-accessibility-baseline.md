# ADR 006 — Accessibility Regression Baseline

## Context

Automated accessibility testing was added to broaden the quality coverage of the project.

The suite executes against the public Catawiki production environment, which is outside the control of this project.

Initial `axe-core` scans of the landing page detected multiple existing `serious` and `critical` accessibility findings.

A strict zero-violation assertion would therefore cause the accessibility suite to remain permanently failing because of pre-existing production issues that cannot be corrected within this assessment.

At the same time, ignoring accessibility violations entirely would remove the regression signal provided by automated scanning.

## Decision

Accessibility automation will use `@axe-core/playwright` for automated rule evaluation.

High-severity coverage will initially focus on findings classified by axe as:

- `serious`
- `critical`

Existing production findings may be recorded as an explicit known-issue baseline after repeated execution confirms that they are consistently present.

The baseline will be maintained by axe violation rule ID rather than by exact affected-node count.

Tests will:

- report all detected high-severity findings;
- allow explicitly documented known violation IDs;
- fail when a new high-severity violation rule appears outside the baseline.

Known violations will be stored separately from the test implementation so that the baseline remains visible and reviewable.

Accessibility scans will initially act as regression and reporting signals rather than strict zero-violation pull-request gates.

## Reasons

### Preserve a useful regression signal

A permanently failing accessibility test provides little actionable feedback.

Allowing documented existing findings means that newly introduced rule violations can still be detected.

### Avoid hiding existing production debt

Known violations remain visible in test output and configuration.

The baseline does not mean that the findings are considered acceptable product behavior.

It only distinguishes pre-existing production findings from newly detected regressions within the scope of this assessment.

### Prefer rule IDs over affected-node counts

Repeated landing-page scans produced the same high-severity rule IDs while the number of affected elements varied.

Dynamic production content can change how many DOM nodes are affected without representing a new accessibility regression.

Rule IDs therefore provide a more stable baseline than exact node counts.

### Use an established accessibility engine

`axe-core` provides established accessibility rules and integrates directly with Playwright through `@axe-core/playwright`.

Using it avoids implementing custom accessibility heuristics for problems already covered by a specialized tool.

## Alternatives Considered

### Require zero serious or critical violations

This was the initial implementation.

It was rejected after exploratory execution showed existing high-severity findings in the production application.

The result would be a permanently failing test for conditions outside the control of this project.

### Log violations without assertions

This would provide diagnostic information but would not act as an automated regression test.

New accessibility problems would not cause any automated signal.

### Baseline exact violation counts

This was rejected because repeated execution showed that affected-node counts can vary with dynamic production content.

### Disable individual axe rules

This would hide entire categories of accessibility findings.

Maintaining an explicit baseline of observed rule IDs preserves visibility into existing issues while still detecting new categories of violations.

## Trade-offs

A rule-ID baseline does not detect an increase in the number of affected elements for an already known rule.

For example, a known violation affecting four elements could later affect twenty elements without introducing a new rule ID.

This is accepted for the current assessment because exact node counts were shown to vary naturally in the dynamic production environment.

A more mature internal implementation could use issue tracking, component-level baselines or controlled test environments to detect finer-grained regressions.

Automated axe scans also do not prove complete WCAG compliance and do not replace manual accessibility testing.

## Consequences

Accessibility tests become stable regression signals instead of permanently failing checks.

Existing accessibility findings remain visible and reviewable.

Each new page or application state should be explored before defining its baseline rather than automatically inheriting the landing-page known violations.

New high-severity rule IDs will fail the corresponding accessibility test and require investigation.
