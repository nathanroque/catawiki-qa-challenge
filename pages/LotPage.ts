import { Page } from '@playwright/test';

/**
 * Encapsulates read-only information exposed on a Catawiki lot details page.
 */
export class LotPage {
  constructor(private readonly page: Page) { }

  /**
   * Locator for the primary lot title heading.
   */
  get title() {
    return this.page.getByRole('heading', {
      level: 1,
    });
  }

  /**
   * Retrieves the currently displayed favourite count.
   *
   * @returns Favourite count parsed as a number.
   */
  async getFavouriteCount(): Promise<number> {
    const favouriteButton = this.page
      .getByTitle('favourite')
      .first();

    const favouriteText =
      await favouriteButton.textContent();

    return Number(favouriteText?.trim());
  }

  /**
   * Retrieves the currently displayed bid amount.
   *
   * @returns Formatted euro amount, or undefined when no bid value is found.
   */
  async getCurrentBid(): Promise<string | undefined> {
    const bidSection = this.page.getByTestId(
      'lot-bid-status-section'
    );

    const bidText = await bidSection.textContent();

    return bidText?.match(/€\s*\d[\d,.]*/)?.[0];
  }
}
