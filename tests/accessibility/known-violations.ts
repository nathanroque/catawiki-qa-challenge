export const landingPageKnownViolationIds = [
  // Existing production accessibility debt observed consistently
  // across repeated landing-page scans.
  'aria-hidden-focus',
  'aria-required-children',
  'aria-required-parent',
  'button-name',
  'color-contrast',
  'link-name',
  'nested-interactive',
  'scrollable-region-focusable',
  'svg-img-alt',
];

export const searchResultsKnownViolationIds = [
  // Existing production accessibility debt observed
  // during repeated search-results scans.
  'button-name',
  'color-contrast',
  'svg-img-alt',
];

export const lotDetailsKnownViolationIds = [
  // Existing production accessibility debt observed
  // during repeated lot-details scans.
  'button-name',
  'color-contrast',
  'link-name',
  'scrollable-region-focusable',
  'svg-img-alt',
];
