/**
 * Known serious and critical Axe rule IDs observed on the landing page.
 *
 * These entries represent documented production accessibility debt and act
 * as a regression baseline. Their presence does not mean the violations are
 * considered acceptable; new high-severity rule IDs outside this baseline
 * should fail the corresponding accessibility test.
 */
export const landingPageKnownViolationIds = [
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

/**
 * Known serious and critical Axe rule IDs observed on the search results page.
 *
 * These entries represent documented production accessibility debt and act
 * as a regression baseline for the search results context.
 */
export const searchResultsKnownViolationIds = [
  'button-name',
  'color-contrast',
  'svg-img-alt',
];

/**
 * Known serious and critical Axe rule IDs observed on the lot details page.
 *
 * These entries represent documented production accessibility debt and act
 * as a regression baseline for the lot details context, including explicitly
 * documented intermittent findings where applicable.
 */
export const lotDetailsKnownViolationIds = [
  'button-name',
  'color-contrast',
  'link-name',
  'scrollable-region-focusable',
  'svg-img-alt',
];
