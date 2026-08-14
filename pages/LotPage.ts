import { Page, expect } from '@playwright/test';

export class LotPage {
  constructor(private readonly page: Page) {}

  get title() {
    return this.page.getByRole('heading', {
      level: 1,
    });
  }

  async getFavouriteCount() {
    const favouriteButton = this.page
      .getByTitle('favourite')
      .first();

    const favouriteText =
      await favouriteButton.textContent();

    return Number(favouriteText?.trim());
  }

  async getCurrentBid() {
    const bidSection = this.page.getByTestId(
      'lot-bid-status-section'
    );

    const bidText = await bidSection.textContent();

    return bidText?.match(/€\s*\d[\d,.]*/)?.[0];
  }
}