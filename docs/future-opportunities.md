# Future Opportunities

## Purpose

This document summarizes improvements that could increase test coverage, reliability, or execution maturity if the project continued.

These are not unfinished requirements.

They were intentionally left out because of production constraints, execution cost, current risk priority, or assignment scope.

## Testing Opportunities

### Full-suite cross-browser execution

The current cross-browser strategy runs only the critical smoke journey across Chromium, Firefox, and WebKit.

During implementation, concurrent multi-browser execution showed timing instability against production, so the cross-browser configuration currently uses:

```ts
workers: 1;
```

Running the entire UI suite across all three browser engines with serialized execution would significantly increase runtime and production traffic.

For the current scope, limiting cross-browser execution to the highest-value journey provides a better balance between confidence and execution cost.

This could be revisited if:

- Parallel execution becomes reliable
- A controlled environment becomes available
- Tests can be distributed across approved runners
- Broader browser compatibility becomes a higher product risk

### Visual regression

Visual regression could detect layout and rendering issues that functional assertions do not catch.

It was not implemented because the production marketplace contains highly dynamic content such as lot images, titles, prices, and recommendations, which would make broad visual snapshots noisy and expensive to maintain.

A future implementation should focus only on stable application-owned components or use deterministic test data.

### Broader internationalization coverage

The current I18N scenario validates switching from English to Dutch and preserving the selected locale through the critical journey.

Additional locales, currency formatting, date formatting, and broader translation checks could be added later.

During implementation, we observed that search results can differ between locales, so future I18N tests should continue using stable application-owned UI as the oracle rather than assuming identical marketplace content.

### Additional edge and negative coverage

Potential examples include:

- Special-character search
- Additional fallback states
- Boundary-value inputs
- Unexpected API response cases

These were considered lower priority than the implemented P0 and P1 scenarios.

They should be added when they represent a distinct product risk rather than only increasing test count.

### Authenticated and state-changing workflows

Future coverage could include:

- Authentication
- Favourites
- User preferences
- Bidding
- Purchasing

These scenarios were intentionally excluded because the current suite targets the real production environment.

State-changing workflows should only be automated with dedicated accounts, controlled data, and an environment where side effects can be safely created and cleaned up.

### Performance and security testing

Performance, load, and security testing could provide valuable additional confidence.

They were not included because these activities can generate aggressive traffic or intentionally probe application boundaries.

They require explicit authorization, defined scope, and an appropriate environment.

## Infrastructure Opportunities

### Approved CI execution environment

The most valuable infrastructure improvement would be running the existing production-facing suite automatically in CI.

GitHub-hosted runners received `403 Forbidden / Access Denied` responses from the production edge layer.

The project therefore intentionally keeps hosted CI limited to static validation instead of attempting to bypass those restrictions.

A future approved or self-hosted runner could enable:

- Automated regression execution
- Cross-browser validation
- Accessibility checks
- I18N checks
- API tests

### CI reports and artifacts

The project already generates local HTML and JUnit reports.

Once production-facing tests can execute safely in CI, the pipeline could publish:

- HTML reports
- JUnit results
- Screenshots
- Videos
- Playwright traces

This would improve failure investigation without requiring local reproduction.

### Layered execution strategy

With a suitable CI environment, execution could be split by feedback speed and risk.

For example:

```text
Pull Request
    ↓
Static validation
    ↓
Critical tests

Main branch
    ↓
Broader regression

Scheduled run
    ↓
Cross-browser
    ↓
Accessibility
    ↓
I18N
```

This would avoid running every expensive scenario on every code change.

### Parameterized CI execution

A future CI pipeline could support manually or automatically selecting execution dimensions such as:

- Target browser
- Locale
- Target environment
- Test scope

For example:

```text
Environment: controlled-test
Browser: firefox
Locale: nl
Scope: smoke
```

This could allow the same automation framework to support targeted validation without duplicating workflows.

It was not implemented because the current project has only one available target environment, the implemented I18N coverage intentionally validates a specific English-to-Dutch journey, and production-facing execution is currently unavailable from GitHub-hosted runners.

If an approved CI environment became available, these dimensions could be exposed through pipeline inputs and mapped to Playwright projects, configuration, environment variables, and test tags.

## Framework Opportunities

### Custom fixtures

Playwright fixtures could eventually centralize repeated setup such as page objects, API clients, authenticated state, or controlled test data.

They were not introduced because the current suite is small enough that explicit setup remains easier to understand.

Fixtures should be added when duplication becomes a real maintenance problem.

### Reusable page components

Shared UI components such as the application header could eventually become reusable Page Object components.

This was considered during I18N implementation but intentionally avoided because the current structure remains simple and duplication is still limited.

The abstraction should be introduced only when multiple pages genuinely share the same behavior.

### Broader contract validation

The existing runtime schemas validate the contracts required by current scenarios.

More APIs and properties could be covered later, but exhaustive production schemas would add maintenance cost without necessarily providing useful confidence.

Future contract work should remain focused on fields and invariants the product actually depends on.

## Quality Opportunities

### Expanded accessibility testing

The current automated accessibility suite provides regression signal using axe.

Future work could include:

- Keyboard navigation
- Focus order
- Screen-reader testing
- Zoom and reflow
- Manual WCAG evaluation

Automated scans should not be treated as proof of full accessibility compliance.

### Real Safari validation

The current cross-browser suite uses Playwright WebKit.

A real Safari/macOS environment could provide additional confidence for Safari-specific behavior that bundled WebKit may not reproduce.

This would require macOS infrastructure or an external browser-testing service.

## Key Constraints Discovered

Several observations influenced the current architecture:

### Production environment

The target is the real Catawiki production application, so the suite remains read-only and avoids aggressive traffic or state changes.

### Headless and CI restrictions

Headless execution and GitHub-hosted traffic can receive production edge restrictions.

The project documents these restrictions rather than attempting to bypass them.

### Dynamic production data

Lot IDs, titles, bids, and result ordering change continuously.

Tests therefore discover runtime data and validate relationships or invariants instead of hard-coding temporary production values.

### Cross-browser timing

Concurrent browser execution showed timing instability.

The dedicated cross-browser suite therefore prioritizes reliability and runs with one worker.

### Locale-dependent results

The same query can return different marketplace results under different locales.

I18N validation therefore focuses on deterministic application-owned locale behavior.

## If the Project Continued

A reasonable next sequence would be:

1. Provide an approved CI execution environment.
2. Run the existing suite automatically.
3. Publish test reports and diagnostics from CI.
4. Re-evaluate broader cross-browser execution.
5. Expand P2 edge coverage based on real product risk.
6. Add broader I18N and accessibility coverage.
7. Introduce authenticated and state-changing scenarios only in a controlled environment.
8. Add visual, performance, and security testing where appropriate.

## Conclusion

The current solution intentionally prioritizes:

- High-value coverage
- Production safety
- Reliable execution
- Maintainability
- Clear test intent

The opportunities above show how the framework could evolve without suggesting that every possible testing technique should be implemented immediately.
