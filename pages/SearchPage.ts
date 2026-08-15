import { Page } from '@playwright/test';
import { dismissCookieConsentIfPresent } from '../support/cookie-consent';

/**
 * Encapsulates interactions available from the Catawiki landing page.
 */
export class SearchPage {
  constructor(private readonly page: Page) {}

  /**
   * Opens the English Catawiki landing page and prepares it for interaction.
   */
  async goto(): Promise<void> {
    await this.page.goto('/');

    await dismissCookieConsentIfPresent(this.page);
  }

  /**
   * Searches for the provided term using the search controls in the page header.
   *
   * @param term Search query to submit.
   */
  async searchFor(term: string): Promise<void> {
    const header = this.page.getByRole('banner');

    const searchInput = header.getByRole('combobox', {
      name: 'Search for brand, model, artist...',
    });

    const searchButton = header.getByRole('button', {
      name: 'Search',
    });

    await dismissCookieConsentIfPresent(this.page);

    await searchInput.fill(term);
    await searchButton.click();
  }
}