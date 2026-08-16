# ADR 007: Separate Cross-Browser Smoke Execution

## Status

Accepted

## Context

The test suite primarily executes against the public Catawiki production environment.

The critical search-to-lot journey is high-value enough to justify validation across Chromium, Firefox, and WebKit.

An initial multi-browser configuration added all three browser projects to the default Playwright configuration.

The critical journey completed successfully when each browser was executed independently.

However, when the broader suite and browser projects were allowed to execute concurrently, intermittent timeouts appeared in the Firefox and WebKit smoke executions.

The failures occurred at different stages of the journey, including navigation completion and interaction blocked by a late cookie-consent overlay.

Running the configured execution with a single worker completed successfully.

Later repeated validation, after cookie-consent handling was hardened, showed that Firefox could still exhaust the default 30-second test budget near the end of the live lot-details journey. A 45-second timeout scoped only to the dedicated cross-browser configuration resolved that timing margin in repeated isolated Firefox and complete cross-browser runs.

The complete test suite does not need to execute across every browser because API, contract, integration, and accessibility scenarios do not all gain equivalent value from browser multiplication.

## Decision

Cross-browser validation will use a dedicated Playwright configuration.

The default `playwright.config.ts` remains Chromium-only and retains the normal execution model for the complete suite.

`playwright.cross-browser.config.ts`:

- runs only scenarios tagged `@smoke`;
- defines Chromium, Firefox, and WebKit projects;
- executes with a single worker;
- uses a scoped 45-second test timeout for the longer live cross-browser journey.

The existing P0 test implementation is reused across browser projects rather than duplicated into browser-specific test files.

## Consequences

### Positive

- Normal suite execution remains fast and predictable.
- Running `playwright test` does not unexpectedly multiply the complete suite across three browsers.
- Cross-browser coverage focuses on the highest-value user journey.
- Browser-specific test duplication is avoided.
- The concurrency mitigation is scoped only to the execution mode that demonstrated instability.
- The strategy can later be used for scheduled execution in an appropriate CI environment.

### Negative

- Cross-browser execution takes longer because browser projects are serialized.
- The complete suite is not validated in Firefox and WebKit.
- A second Playwright configuration must be maintained.
- Browser-specific issues outside the critical smoke journey may remain undetected.

## Alternatives Considered

### Run the complete suite in all three browsers

Rejected because it would significantly increase execution cost and production traffic while providing limited additional value for API, contract, integration, and accessibility scenarios.

### Keep all browser projects in the default configuration

Rejected because normal `playwright test` execution would implicitly trigger cross-browser coverage and could reproduce the concurrency-related instability observed during exploration.

### Increase global timeouts

Rejected because increasing the default timeout for the whole project would affect unrelated tests.

A later Firefox-specific timing observation justified a different, narrower decision: the dedicated cross-browser configuration uses a 45-second test budget while the normal Chromium configuration keeps its existing timeout.

### Add retries

Rejected because retries could hide execution instability rather than make the cross-browser strategy deterministic.

### Set the entire project to one worker

Rejected because the constraint is specific to cross-browser execution and should not unnecessarily reduce parallelism for the normal Chromium suite.
