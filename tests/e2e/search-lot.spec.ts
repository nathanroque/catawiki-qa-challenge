import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { LotPage } from '../../pages/LotPage';

test('user can search for Train and inspect the second lot @smoke @e2e', async ({ page }) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);
  const lotPage = new LotPage(page);

  await test.step('Open Catawiki landing page', async () => {
    await searchPage.goto();
  });

  await test.step('Search for "Train"', async () => {
    await searchPage.searchFor('Train');

  await expect(
    searchResultsPage.lots.first()
  ).toBeVisible();
  });

  const { selectedTitle, lotId } = await test.step(
    'Capture second lot identity',
    async () => {
      const selectedTitle = await searchResultsPage.getLotTitle(1);
      expect(selectedTitle).toBeTruthy();

      const lotId = await searchResultsPage.getLotId(1);
      expect(lotId).toBeTruthy();

      return {
        selectedTitle: selectedTitle!.trim(),
        lotId,
      };
    }
  );

  await test.step('Open selected lot', async () => {
    await searchResultsPage.openLot(1);
  });

  await test.step('Validate selected lot identity', async () => {
    await expect(page).toHaveURL(new RegExp(`/l/${lotId}`));
    await expect(lotPage.title).toHaveText(selectedTitle);
  });

  await test.step('Retrieve and validate lot details', async () => {
    const favourites = await lotPage.getFavouriteCount();
    expect(favourites).toBeGreaterThanOrEqual(0);

    const currentBid = await lotPage.getCurrentBid();
    expect(currentBid).toBeTruthy();

    console.table({
      title: selectedTitle,
      favourites,
      currentBid,
    });
  });
});

test('user sees related objects when search has no exact results @e2e @negative', async ({ page }) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);

  await test.step('Open Catawiki landing page', async () => {
    await searchPage.goto();
  });

  await test.step('Search for a query with no exact matches', async () => {
    await searchPage.searchFor(
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
    );
  });

  await test.step('Validate no-exact-results fallback message', async () => {
    await expect(
      page.getByText(
        'No exact results. Check out these related objects.'
      )
    ).toBeVisible();
  });

  await test.step('Validate related objects are displayed', async () => {
    await expect(
      searchResultsPage.lots.first()
    ).toBeVisible();

    await expect(
      page.getByTestId('object-amount')
    ).toContainText('related objects');
  });
});
