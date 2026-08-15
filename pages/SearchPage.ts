import { Page } from '@playwright/test';

export class SearchPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');

    const continueWithoutAccepting = this.page.getByText(
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