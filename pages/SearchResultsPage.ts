import { Page } from '@playwright/test';

/**
 * Encapsulates read-only interactions with the Catawiki search results page.
 */
export class SearchResultsPage {
  constructor(private readonly page: Page) { }

  /**
   * Locator representing the lot cards currently rendered in the result list.
   */
  get lots() {
    return this.page.locator(
      '[data-testid^="lot-card-container-"]'
    );
  }

  /**
   * Returns the lot card at a zero-based result position.
   *
   * @param index Zero-based position in the current result list.
   */
  getLot(index: number) {
    return this.lots.nth(index);
  }

  /**
   * Retrieves the visible title of a lot at a zero-based result position.
   *
   * @param index Zero-based position in the current result list.
   * @returns Lot title, or null when no text content is available.
   */
  async getLotTitle(index: number): Promise<string | null> {
    return this.getLot(index)
      .locator('.c-lot-card__title')
      .textContent();
  }

  /**
   * Retrieves the destination URL of a lot at a zero-based result position.
   *
   * @param index Zero-based position in the current result list.
   * @returns Lot URL, or null when the result does not expose an href.
   */
  async getLotHref(index: number): Promise<string | null> {
    return this.getLot(index)
      .getByRole('link')
      .getAttribute('href');
  }

  /**
   * Opens the lot at a zero-based result position.
   *
   * @param index Zero-based position in the current result list.
   */
  async openLot(index: number): Promise<void> {
    await this.getLot(index)
      .getByRole('link')
      .click();
  }

  /**
   * Extracts the numeric Catawiki lot ID from a search-result URL.
   *
   * @param index Zero-based position in the current result list.
   * @returns Numeric lot identifier.
   * @throws If the result does not contain a link or the URL does not contain a lot ID.
   */
  async getLotId(index: number): Promise<number> {
    const href = await this.getLotHref(index);

    if (!href) {
      throw new Error(
        `Lot at index ${index} does not contain a link`
      );
    }

    const match = href.match(/\/l\/(\d+)/);

    if (!match) {
      throw new Error(
        `Could not extract lot ID from URL: ${href}`
      );
    }

    return Number(match[1]);
  }
}
