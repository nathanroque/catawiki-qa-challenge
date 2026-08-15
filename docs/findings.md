# Findings and Observations

This document records notable findings observed while exploring and automating the public Catawiki production application.

The purpose is to preserve useful quality signals discovered during the challenge without overstating their severity or classifying observations as confirmed defects or security vulnerabilities without sufficient evidence.

## Accessibility Findings

Automated accessibility scanning is performed with `@axe-core/playwright`.

The landing-page baseline currently contains the following recurring high-severity axe rule IDs:

| Rule ID | Impact |
|---|---|
| `aria-hidden-focus` | serious |
| `aria-required-children` | critical |
| `aria-required-parent` | critical |
| `button-name` | critical |
| `color-contrast` | serious |
| `link-name` | serious |
| `nested-interactive` | serious |
| `scrollable-region-focusable` | serious |
| `svg-img-alt` | serious |

Across three consecutive exploratory executions, the same nine rule IDs were observed.

The number of affected DOM nodes was not completely stable. For example, `color-contrast` remained present while the affected-node count varied between executions.

For that reason, automated regression detection currently baselines rule IDs rather than exact node counts.

These findings remain visible in test output. Their presence in the baseline does not mean they are considered acceptable product behavior; the baseline only distinguishes existing production findings from newly detected rule categories within the scope of this assessment.

Automated axe findings are treated as accessibility signals and do not by themselves establish complete WCAG compliance or replace manual accessibility evaluation.

## Environment and Reliability Findings

### Headless browser execution

Headed Chromium successfully loads the public application during local execution.

Headless Chromium can receive an `Access Denied` response from the production edge layer.

The suite does not attempt to circumvent this behavior. Local browser execution is therefore configured to run headed by default, while unattended CI execution remains subject to the production environment constraint.

### Cookie consent

Fresh browser contexts may display a Usercentrics cookie-consent dialog that can intercept normal page interaction.

The automation dismisses the dialog through the user-facing `Continue without accepting` action when it is present.

During framework refinement, an alternative approach was investigated to determine whether the consent state could be preloaded through Playwright rather than handled through the UI.

Browser storage was compared before and after selecting `Continue without accepting`.

The investigation found that:

- `cookie_preferences_used_cta=reject_all` is created after the action;
- `has_pending_cookie_consent_sync=true` is also created;
- neither cookie, individually or together, is sufficient to suppress the dialog in a fresh browser context;
- a Usercentrics `localStorage` value named `ucString` is sufficient to suppress the dialog;
- equivalent rejection flows produced different `ucString` values.

The stored `ucString` is opaque and appears coupled to the active Usercentrics configuration, including factors such as service configuration, controller state, versions, and potentially locale or dynamic metadata.

For this reason, hard-coding the value in Playwright configuration or a shared `storageState` was intentionally rejected.

Although preloading the value would remove the UI interaction, it would introduce dependency on an internal third-party consent representation that is less stable and less understandable than using the application's normal rejection flow.

Cookie-consent handling is therefore kept as a small environment-support utility that interacts with the public UI when required.

A maintained internal test platform could instead generate and periodically refresh a validated consent storage state, but that additional infrastructure is not justified for the scope of this assessment.

### Dynamic production data

Search results, lot identifiers, bids, favourite counts and auction state change over time.

Tests therefore discover values at runtime and prefer structural or relational assertions over hard-coded production data.

## API and Network Observations

### Server-rendered search flow

The primary search page is server-rendered and returns an HTML document containing serialized application data rather than exposing a simple dedicated JSON search endpoint for the tested flow.

A direct attempt to retrieve the search document through Playwright `APIRequestContext` received `403 Access Denied`.

The implementation was therefore redesigned as a UI/API integration test rather than attempting to bypass the production edge behavior.

### Read-only JSON endpoints

Network reconnaissance during normal anonymous browsing identified read-only JSON endpoints used by the public application, including:

```text
GET /buyer/api/v2/feeds/feeds_default/lots
GET /buyer/api/v3/lots/{lotId}/navigation
GET /buyer/api/v3/bidding/lots?ids={lotId}
```

For the implemented requests, explicitly requesting JSON with:

```http
Accept: application/json
```

allowed the endpoints to be exercised without an authenticated session or manually supplied cookies.

These observations are not treated as security vulnerabilities. The endpoints were observed as part of normal public application behavior and are only used for low-impact, read-only validation.

## Potential Risks Requiring Further Validation

No observation in this document should be described as a security breach without additional evidence and appropriate authorization.

If a behavior appears security-relevant during future exploration, it should be recorded as a potential risk requiring further validation rather than immediately classified as a vulnerability.

The current challenge intentionally avoids:

- authentication or authorization bypass attempts;
- arbitrary internal endpoint probing;
- state-changing API operations;
- security fuzzing;
- load or stress testing;
- collection of sensitive data.

### Browser translation UI

During headed local execution, Chrome may display its native Google Translate
prompt when the English Catawiki page is opened in a browser configured with a
different preferred language.

This UI belongs to the browser rather than the Catawiki application and is
therefore outside the page DOM and outside the scope of application-level
Playwright selectors.

No interference with the implemented scenarios was observed, so no framework
handling was added.

### Registration slide-in accessibility observation

A non-deterministic registration slide-in was observed during exploratory testing.

The component's close control is implemented as a clickable `div` without an
accessible role, accessible name, or keyboard focusability.

This observation was identified through DOM and accessibility inspection rather
than through the automated axe baseline.

It demonstrates one limitation of relying exclusively on automated accessibility
scanning: interactive elements without semantic interactive roles may not always
be classified by rules such as `button-name`.
