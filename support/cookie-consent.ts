import type { Page } from '@playwright/test';

/**
 * Dismisses the Usercentrics consent overlay when it appears.
 *
 * The consent component initializes asynchronously after navigation,
 * so the helper waits for the actual blocking overlay rather than
 * relying on the dismissal action text or host visibility.
 */
export async function dismissCookieConsentIfPresent(page: Page): Promise<void> {
  const consent = page.locator('#usercentrics-cmp-ui');
  const overlay = consent.locator('#uc-overlay');

  try {
    await overlay.waitFor({
      state: 'visible',
      timeout: 8_000,
    });
  } catch {
    return;
  }

  try {
    await consent.locator('#uc-close-icon').click({
      timeout: 3_000,
    });
  } catch (error) {
    if (await overlay.isVisible()) {
      throw error;
    }
  }

  await overlay.waitFor({
    state: 'hidden',
    timeout: 3_000,
  });
}
