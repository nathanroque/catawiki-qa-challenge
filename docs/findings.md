# Findings and Observations

This document records notable findings observed while exploring and automating the public Catawiki production application.

The purpose is to preserve useful quality signals discovered during the challenge without overstating their severity or classifying observations as confirmed defects or security vulnerabilities without sufficient evidence.

## Accessibility Findings

Automated accessibility scanning is performed with `@axe-core/playwright`.

The landing-page baseline currently contains the following recurring high-severity axe rule IDs:

| Rule ID                       | Impact   |
| ----------------------------- | -------- |
| `aria-hidden-focus`           | serious  |
| `aria-required-children`      | critical |
| `aria-required-parent`        | critical |
| `button-name`                 | critical |
| `color-contrast`              | serious  |
| `link-name`                   | serious  |
| `nested-interactive`          | serious  |
| `scrollable-region-focusable` | serious  |
| `svg-img-alt`                 | serious  |

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

Production-facing automated scenarios are therefore kept outside the current GitHub-hosted workflow. The hosted pipeline instead runs the deterministic `quality` gate (type checking, ESLint, Prettier format checking and schema-validator unit tests) plus Playwright discovery for the default and cross-browser configurations.

### Accessibility scan execution cost and readiness

Full-page axe scans have a higher execution cost than the functional scenarios and retain a dedicated 60-second timeout.

The accessibility scenarios were initially serialized, but serial mode was removed because the page contexts are independent and a failure in one scan should not skip later scans. Each scenario now waits for meaningful page readiness before running Axe: visible search results for the search page and a visible lot title after lot navigation.

After these readiness changes, the accessibility suite completed three repeated runs with two workers without failure. The mitigation therefore remains scoped to accessibility timing without introducing logical test dependencies.

### Internationalization execution timing

The language-persistence scenario completed successfully during isolated execution.

During repeated parallel full-suite execution, the scenario intermittently exceeded the default 30-second Playwright timeout while still reaching valid localized application states.

Because the scenario includes an additional locale transition before the search-to-lot journey, a scoped 45-second timeout was introduced.

The global timeout and retry strategy were left unchanged.

Three consecutive full-suite executions completed successfully after this adjustment.

### Cookie consent

Fresh browser contexts may initialize the Usercentrics consent component several seconds after page navigation begins. During direct browser investigation, `DOMContentLoaded` completed roughly 1.4–2.1 seconds after navigation while the blocking consent overlay became visible roughly 4.7–5.7 seconds after navigation.

The observed structure was:

```text
aside#usercentrics-cmp-ui
└── open shadow root
    ├── #uc-overlay
    └── #uc-main-dialog
        └── a#uc-close-icon
```

The host itself is not a reliable visibility signal: it can have zero height and remains in the document after dismissal. The full-screen `#uc-overlay` is the element that blocks the application through pointer interception.

The dismissal action also does not provide a reliable semantic locator. It is an anchor without `href`, explicit role, `aria-label` or test ID, and Playwright did not expose it as a button or link. Its text is also not stable across locale; an `/en` visit was observed rendering the Portuguese `Continuar sem aceitar` label.

The implemented helper therefore:

- waits for the scoped `#uc-overlay` to become visible within a bounded initialization window;
- uses the vendor-specific `#uc-close-icon` action isolated inside the support utility;
- allows Playwright's normal actionability checks to perform the click;
- verifies that the blocking overlay becomes hidden or detached before continuing;
- does not use arbitrary sleeps, forced clicks or a general retry loop.

Browser storage was also investigated. An opaque Usercentrics `localStorage` value could suppress the dialog, but equivalent rejection flows produced different values. Hard-coding that third-party state was rejected because it would be more tightly coupled to Usercentrics internals than the isolated UI helper.

After this change, the complete default suite passed three consecutive runs, and the accessibility suite also passed three repeated runs with two workers.

### Dynamic production data

Search results, lot identifiers, bids, favourite counts and auction state change over time.

Tests therefore discover values at runtime and prefer structural or relational assertions over hard-coded production data.

### Responsive search and bid rendering

Representative mobile exploration with Playwright's `iPhone 13` device profile exposed two implementation differences from the desktop journey.

The mobile header keeps the search combobox hidden until the dedicated mobile search control is opened. The shared `SearchPage` abstraction was updated to support both the directly visible desktop input and the mobile reveal interaction.

On the lot page, responsive bid representations may coexist in the DOM. An initial attempt to make bid lookup global allowed the mobile test to pass but created a strict-mode ambiguity on desktop because two `Current bid` labels were present. The final helper resolves the visible supported bid label and reads its associated amount.

After this refinement, both the desktop smoke journey and the representative mobile journey passed independently, and the full 24-test Chromium suite passed with two workers.

This is treated as a responsive-automation finding rather than a product defect: the user-visible behavior remained correct, while the exploration identified assumptions in the test abstraction that were specific to the desktop DOM.

### Search-result presentation modes

The search page exposes gallery and normal result presentations. Both preserve the stable `lot-card-container-*` identity contract, but the lot title is rendered through different internal markup.

The original title helper supported only the gallery representation and failed when the second `Train` result was inspected in normal view. The Page Object was hardened to support both observed title structures.

The maintained P2 scenario also observed that normal view remained active after opening a lot and returning to search results and after reloading the results page. The persistence mechanism was not investigated and is not assumed.

## API and Network Observations

### Server-rendered search flow

The primary search page is server-rendered and returns an HTML document containing serialized application data rather than exposing a simple dedicated JSON search endpoint for the tested flow.

A direct attempt to retrieve the search document through Playwright `APIRequestContext` received `403 Access Denied`.

The implementation was therefore redesigned as a UI/API integration test rather than attempting to bypass the production edge behavior.

The integration test was later strengthened to compare shared runtime business state for the selected lot. The displayed favourite count is compared with `favorite_count`, and the displayed euro current bid is compared with `current_bid_amount.EUR`, in addition to correlating the runtime lot identifier.

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

### Cross-browser execution concurrency and timing

The critical smoke journey was successfully executed independently in Chromium, Firefox, and WebKit.

Earlier concurrent multi-project execution produced intermittent timeouts in Firefox and WebKit at different stages of the live journey. The dedicated cross-browser configuration therefore retains a single worker, both to preserve the stable execution mode already demonstrated and to avoid unnecessary concurrent traffic against production.

After the Usercentrics helper was hardened, repeated cross-browser execution exposed a separate Firefox timing issue: twice in three runs, the default 30-second test budget expired while waiting for the bid-status content near the end of the lot-details flow. The failure was the test-level budget being exhausted, not a demonstrated defect in the bid locator.

The cross-browser configuration was given a scoped 45-second timeout rather than increasing locator timeouts, enabling retries, or changing the default Chromium timeout.

Validation after the change completed successfully in three isolated Firefox runs and three complete Chromium/Firefox/WebKit runs.

The normal Chromium suite now uses controlled parallelism with `fullyParallel: false` and at most two local workers, while CI remains limited to one worker.
