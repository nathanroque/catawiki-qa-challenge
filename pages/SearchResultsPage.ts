import { Page } from '@playwright/test';

export class SearchResultsPage {
  constructor(private readonly page: Page) {}

  get lots() {
    return this.page.locator(
      '[data-testid^="lot-card-container-"]'
    );
  }

  getLot(index: number) {
    return this.lots.nth(index);
  }

  async getLotTitle(index: number) {
    return this.getLot(index)
      .locator('.c-lot-card__title')
      .textContent();
  }

  async getLotHref(index: number) {
    return this.getLot(index)
      .getByRole('link')
      .getAttribute('href');
  }

  async openLot(index: number) {
    await this.getLot(index)
      .getByRole('link')
      .click();
  }
}