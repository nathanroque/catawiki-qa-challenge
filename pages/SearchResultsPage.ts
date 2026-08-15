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

  async getLotId(index: number) {
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