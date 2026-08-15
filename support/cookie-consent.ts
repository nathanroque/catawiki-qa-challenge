import { Page } from '@playwright/test';

/**
 * Dismisses the optional production cookie-consent dialog through
 * its user-facing "Continue without accepting" action when present.
 *
 * The consent state is intentionally handled through the UI instead
 * of preloading Usercentrics storage values because the persisted
 * `ucString` is opaque and configuration-dependent.
 *
 * @param page Active Playwright page.
 */
export async function dismissCookieConsentIfPresent(
  page: Page
): Promise<void> {
  const continueWithoutAccepting = page.getByText(
    'Continue without accepting',
    { exact: true }
  );

  await continueWithoutAccepting
    .waitFor({
      state: 'visible',
      timeout: 3000,
    })
    .catch(() => {});

  if (await continueWithoutAccepting.isVisible()) {
    await continueWithoutAccepting.click();
  }
}