# Production Findings and Observations

This document records behavior observed from the public Catawiki application during the challenge. It separates observations from product-defect or security conclusions. The repository does not own the production application, so findings should be independently triaged before being classified as confirmed defects.

## Environment and CI observations

### Headless and hosted access

- Headed local browser execution loaded the production application.
- Headless Chromium could receive `Access Denied` from the production edge layer.
- A read-only feed request from a GitHub-hosted Ubuntu runner returned `403 Forbidden / Access Denied` after checkout, installation, and TypeScript checking succeeded.

Interpretation: the environment restricts at least some automated execution modes and hosted origins. The suite does not attempt to identify or bypass the edge-control mechanism. Current CI behavior is documented in the [README](../README.md#hosted-ci).

### Usercentrics lifecycle

Fresh contexts showed `DOMContentLoaded` approximately 1.4–2.1 seconds after navigation and the blocking consent overlay approximately 4.7–5.7 seconds after navigation.

Observed structure:

```text
aside#usercentrics-cmp-ui
└── open shadow root
    ├── #uc-overlay
    └── #uc-main-dialog[role="dialog"][aria-modal="true"]
        └── a#uc-close-icon
```

The fixed overlay, not the host's own geometry, intercepted underlying pointer input. The decline action lacked reliable button/link semantics and its visible text was observed in more than one language. Dismissal removed the overlay/dialog while the host could remain.

Opaque Usercentrics local-storage state was investigated but varied between equivalent rejection flows. Hard-coding it was rejected as tighter vendor coupling than the isolated UI helper.

### Late prompts

A non-deterministic registration slide-in was observed. Its close control was a clickable `div` without an accessible role, name, or keyboard focusability. This was found through DOM/accessibility inspection rather than guaranteed Axe detection.

A late NPS/CSAT survey was also observed during prolonged browsing. Maintained scenarios normally completed before it appeared, so no proactive handler was added. If longer future journeys show actual interference, a helper should dismiss it without submitting feedback.

Neither observation is treated as a security finding.

## Dynamic auction state and bidding semantics

Search results, identities, ordering, favourite counts, bids, and auction positions change over time and can differ by locale.

The second result can display either `Current bid` or `Starting bid`. The UI distinction is meaningful and is preserved in logs and assertions. In the observed bidding response, `current_bid_amount.EUR` could contain the comparable displayed amount even when the UI label was `Starting bid`.

The UI/API integration therefore compares the amount without relabeling the UI state. A real bid or favourite update between browser and API observations remains a legitimate race that can require investigation.

## Search and presentation observations

### Search response

The primary `/en/s?q=...` search response is server-rendered HTML containing serialized application data rather than a dedicated JSON search endpoint used by the maintained journey. A direct APIRequestContext attempt to retrieve the search document received `403 Access Denied`; the browser flow remained the appropriate layer.

### No-exact-result behavior

An improbable query did not produce an empty page. The application displayed a “No exact results” message with related objects. The negative test validates this observed behavior.

### Result view modes

Gallery and normal views preserve `lot-card-container-*` identity but render titles through different internal markup. The original gallery-only title helper failed in normal view. Normal mode remained active after lot navigation/back and after reload in observed runs.

### Responsive behavior

On the `iPhone 13` profile, the header search combobox remained hidden until the mobile search control was opened. Lot pages could contain multiple responsive bidding labels, producing strict-locator ambiguity until the visible representation was selected.

## Locale observations

Switching from English to Dutch changed application-owned UI and URL locale. The same search query could produce different result identities and ordering between locales. Dynamic lot content is therefore not a valid cross-locale translation oracle.

## API and network observations

Normal anonymous application behavior exposed these relevant read-only endpoints:

```text
GET /buyer/api/v2/feeds/feeds_default/lots
GET /buyer/api/v3/lots/{lotId}/navigation
GET /buyer/api/v3/bidding/lots?ids={lotId}
```

The implemented requests worked with `Accept: application/json` without manually supplied authentication or cookies during local investigation. This is public-behavior evidence, not a security vulnerability.

Sanitized examples are available in [API samples](api-samples/README.md). They are not stable fixtures or complete schemas.

## Accessibility observations

Automated scans evaluate serious and critical Axe findings on the landing, search-results, and lot pages.

### Landing page known rule IDs

`aria-hidden-focus`, `aria-required-children`, `aria-required-parent`, `button-name`, `color-contrast`, `link-name`, `nested-interactive`, `scrollable-region-focusable`, and `svg-img-alt`.

### Search-results known rule IDs

`button-name`, `color-contrast`, and `svg-img-alt`.

### Lot-page known rule IDs

`button-name`, `color-contrast`, `link-name`, `scrollable-region-focusable`, and `svg-img-alt`.

The lot-page `link-name` rule was observed intermittently rather than consistently. It remains explicitly documented in the known-production baseline.

Affected-node counts varied. Rule-ID baselining therefore provides only a coarse regression signal: it detects a new severe category but not additional nodes under a known category. Axe also does not replace keyboard, screen-reader, focus-order, zoom, reflow, or manual WCAG evaluation.

## Execution observations

- The maintained default suite contains 24 discovered Chromium tests in eight files: 10 production-facing scenarios and 14 deterministic validator cases.
- Cross-browser discovery produces three executions of the one `@smoke` scenario.
- Concurrent multi-project smoke execution showed intermittent Firefox/WebKit timing failures.
- Serialized cross-browser execution completed successfully in the documented validation runs.
- Firefox later exhausted the default 30-second test budget near the final live bid-state step; the cross-browser configuration uses a scoped 45-second budget.
- Accessibility uses a scoped 60-second budget; I18N uses 45 seconds.
- Retries are disabled.

Execution history is evidence from the challenge period, not a guarantee of future production stability.
