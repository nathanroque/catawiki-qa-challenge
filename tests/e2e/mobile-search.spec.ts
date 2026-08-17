import { test, expect, devices } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { LotPage } from '../../pages/LotPage';

test.use({
  ...devices['iPhone 13'],
});

test('user can complete the critical Train journey on a representative mobile device @e2e @mobile', async ({
  page,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);
  const lotPage = new LotPage(page);

  await test.step('Open Catawiki and search for Train', async () => {
    await searchPage.goto();
    await searchPage.searchFor('Train');

    await expect(page).toHaveURL(/\/en\/s\?q=Train/);
  });

  const { selectedTitle, lotId } =
    await test.step('Validate and capture the second search result', async () => {
      const resultCount = await searchResultsPage.lots.count();

      expect(
        resultCount,
        'Expected at least two search results for "Train"',
      ).toBeGreaterThanOrEqual(2);

      await expect(searchResultsPage.getLot(1)).toBeVisible();

      const selectedTitle = await searchResultsPage.getLotTitle(1);
      const lotId = await searchResultsPage.getLotId(1);

      expect(selectedTitle).toBeTruthy();

      return {
        selectedTitle,
        lotId,
      };
    });

  await test.step('Open the selected lot and validate its identity', async () => {
    await searchResultsPage.openLot(1);

    await expect(page).toHaveURL(new RegExp(`/l/${lotId}`));
    await expect(lotPage.title).toHaveText(selectedTitle!.trim());
  });

  await test.step('Retrieve and validate lot details', async () => {
    const favourites = await lotPage.getFavouriteCount();

    expect(favourites).toBeGreaterThanOrEqual(0);

    const bidStatus = await lotPage.getBidStatus();

    expect(
      bidStatus.label,
      `Expected the second lot to have a current bid, but it is currently in "${bidStatus.label}" state`,
    ).toBe('Current bid');

    expect(bidStatus.amount).toMatch(/^€\s*\d[\d.,\s]*$/);

    console.table({
      title: selectedTitle!.trim(),
      favourites,
      currentBid: bidStatus.amount,
    });
  });
});
