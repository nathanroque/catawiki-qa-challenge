import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';

test.describe.configure({
  timeout: 45_000,
});

test('selected language persists through the critical journey @i18n @e2e', async ({ page }) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);

  await test.step('Open the English Catawiki experience', async () => {
    await searchPage.goto();

    await expect(page).toHaveURL(/\/en(?:\/|$)/);
  });

  await test.step('Switch the interface language to Dutch', async () => {
    await searchPage.selectLanguage('en', 'Nederlands');

    await expect(page).toHaveURL(/\/nl(?:\/|$)/);

    await expect(
      page.getByRole('combobox', {
        name: /Zoeken naar merk, model/i,
      })
    ).toBeVisible();
  });

  await test.step('Search for Train using the Dutch experience', async () => {
    await searchPage.searchFor('Train');

    await expect(page).toHaveURL(/\/nl\/s\?/);

    await expect(
      searchResultsPage.getLot(1)
    ).toBeVisible();
  });

  await test.step('Open the second lot and preserve the Dutch locale', async () => {
    await searchResultsPage.openLot(1);

    await expect(page).toHaveURL(/\/nl\/l\//);

    await expect(
      page.getByRole('button', {
        name: 'nl',
        exact: true,
      })
    ).toBeVisible();
  });
});