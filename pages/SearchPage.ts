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
   * Searches for the provided term using the responsive header search.
   *
   * On smaller layouts, the search input is opened through the mobile
   * navigation before the term is entered.
   *
   * @param term Search term to submit.
   */
  async searchFor(term: string): Promise<void> {
    const header = this.page.getByRole('banner');
    const searchInput = header.getByRole('combobox');

    if (!(await searchInput.isVisible())) {
      await header.locator('button.c-header__mobile-nav__search').click();

      await searchInput.waitFor({
        state: 'visible',
      });
    }

    await searchInput.fill(term);

    await header
      .getByRole('button', {
        name: 'Search',
      })
      .click();
  }
  async selectLanguage(currentLocale: string, language: string): Promise<void> {
    const header = this.page.getByRole('banner');

    await header
      .getByRole('button', {
        name: currentLocale,
        exact: true,
      })
      .click();

    await this.page
      .getByRole('menuitem', {
        name: language,
        exact: true,
      })
      .click();
  }
}
