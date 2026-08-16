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

Repeated exploratory and full-suite executions identified the rule IDs currently included in the landing-page baseline.

The exact set present in an individual execution and the number of affected DOM nodes were not completely stable because the production page contains dynamic and conditionally rendered content.

For that reason, automated regression detection currently baselines previously observed rule IDs rather than requiring every known rule to appear in every execution or comparing exact node counts.

These findings remain visible in test output. Their presence in the baseline does not mean they are considered acceptable product behavior; the baseline only distinguishes existing production findings from newly detected rule categories within the scope of this assessment.

Automated axe findings are treated as accessibility signals and do not by themselves establish complete WCAG compliance or replace manual accessibility evaluation.

## Environment and Reliability Findings

### Headless browser execution

Headed Chromium successfully loads the public application during local execution.

Headless Chromium can receive an `Access Denied` response from the production edge layer.

The suite does not attempt to circumvent this behavior. Local browser execution is therefore configured to run headed by default, while unattended CI execution remains subject to the production environment constraint.

### GitHub-hosted CI execution

After introducing the initial GitHub Actions workflow, the read-only API test was executed from a GitHub-hosted Ubuntu runner.

The repository checkout, dependency installation, and TypeScript type check completed successfully, but the production feed API request returned `403 Forbidden / Access Denied`.

This indicates that the production edge restrictions observed during local headless browser execution also affect at least some requests originating from the GitHub-hosted CI environment.

The workflow does not attempt to bypass this restriction through altered headers, retries, or other anti-automation workarounds.

Production-facing automated scenarios are therefore kept outside the current GitHub-hosted workflow, while static validation remains suitable for unattended CI execution.

### Accessibility scan execution cost

Individual accessibility scans were reliable during exploratory execution, but
repeated full-suite execution showed that multiple concurrent full-page axe
scans could exceed the default Playwright test timeout.

The accessibility scenarios are therefore serialized and use a dedicated
60-second timeout.

Other test layers retain the normal execution model and default timeout. This
keeps the mitigation scoped to the workload that demonstrated the additional
execution cost rather than increasing timeouts globally.

### Internationalization execution timing

The language-persistence scenario completed successfully during isolated execution.

During repeated parallel full-suite execution, the scenario intermittently exceeded the default 30-second Playwright timeout while still reaching valid localized application states.

Because the scenario includes an additional locale transition before the search-to-lot journey, a scoped 45-second timeout was introduced.

The global timeout and retry strategy were left unchanged.

Three consecutive full-suite executions completed successfully after this adjustment.

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

Repeated full-suite execution later exposed an additional timing condition:
Usercentrics may complete initialization after the initial navigation-time
consent check.

In one observed failure, the search control was already visible and enabled,
but the consent overlay intercepted pointer events until the test timeout was
reached.

Cookie handling is therefore also applied immediately before interactions that
may be blocked by a late consent overlay rather than forcing clicks through the
component.

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

### Locale-dependent search results

During internationalization testing, the `Train` search produced different result ordering and lot content under the Dutch locale compared with the English experience.

This observation is not treated as a defect.

It means that search-result identity and ordering should not be assumed to remain stable across locales.

The internationalization scenario therefore validates locale persistence and translated application-owned UI while continuing to discover the selected lot dynamically at runtime.

Lot titles, IDs, ordering, and seller-provided content are not used as cross-locale expectations.

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

### Search results accessibility

Repeated scans of the `Train` search results page identified the following
high-severity axe rule IDs:

- `button-name` — critical
- `color-contrast` — serious
- `svg-img-alt` — serious

`button-name` and `svg-img-alt` were present across the initial isolated
executions.

During full-suite execution, `color-contrast` was additionally detected on
multiple lot countdown elements. The affected text used a contrast ratio of
3.07:1 against a white background, below the 4.5:1 threshold reported by axe.

The number of affected nodes also varied between execution contexts. This
reinforces the decision to baseline known accessibility findings by rule ID
rather than exact violation count.

### Lot details accessibility

Repeated scans of the lot details page identified the following high-severity
axe rule IDs:

- `button-name` — critical
- `color-contrast` — serious
- `link-name` — serious
- `scrollable-region-focusable` — serious
- `svg-img-alt` — serious

`button-name`, `color-contrast`, `scrollable-region-focusable`, and
`svg-img-alt` were observed across all exploratory runs.

`link-name` was observed in one execution but was not reproduced in the
subsequent isolated scans. Because it was a confirmed finding within the same
page context, it remains part of the known baseline.

Affected-node counts varied between executions, reinforcing the decision to
baseline accessibility debt by rule ID rather than exact node count.

### Cross-browser execution concurrency

The critical smoke journey was successfully executed independently in Chromium, Firefox, and WebKit.

When the broader multi-project execution ran with normal local concurrency, intermittent timeouts were observed in the Firefox and WebKit smoke executions.

The failures occurred at different stages, including lot navigation completion and a search interaction blocked by a late Usercentrics consent overlay.

Because the same browser scenarios succeeded independently, the behavior was treated as an execution-reliability concern rather than evidence of a browser-specific functional defect.

A subsequent execution using a single worker completed successfully across the full configured run.

Cross-browser smoke validation is therefore executed serially through a dedicated configuration while the normal Chromium suite retains its existing parallel execution model.
