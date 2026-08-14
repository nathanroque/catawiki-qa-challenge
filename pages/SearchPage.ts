import { Page } from '@playwright/test';

export class SearchPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async searchFor(term: string) {
    const header = this.page.getByRole('banner');

    const searchInput = header.getByRole('combobox', {
      name: 'Search for brand, model, artist...',
    });

    const searchButton = header.getByRole('button', {
      name: 'Search',
    });

    await searchInput.fill(term);
    await searchButton.click();
  }
}