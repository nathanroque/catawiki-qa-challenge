import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { LotPage } from '../../pages/LotPage';
import { keyword } from '../../support/test-data';

test(`user can search for ${keyword} and inspect the second lot @smoke @e2e`, async ({
  page,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);
  const lotPage = new LotPage(page);

  await test.step('Open Catawiki landing page', async () => {
    await searchPage.goto();
  });

  await test.step(`Search for ${keyword}`, async () => {
    await searchPage.searchFor(keyword);

    await expect(page).toHaveURL(new RegExp(`/en/s\\?q=${keyword}`));

    await expect(
      searchResultsPage.getLot(1),
      `Expected at least two search results for ${keyword}`,
    ).toBeVisible();
  });

  const { selectedTitle, lotId } =
    await test.step('Capture second lot identity', async () => {
      const selectedTitle = await searchResultsPage.getLotTitle(1);
      expect(selectedTitle).toBeTruthy();

      const lotId = await searchResultsPage.getLotId(1);
      expect(lotId).toBeTruthy();

      return {
        selectedTitle: selectedTitle!.trim(),
        lotId,
      };
    });

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

    const bidStatus = await lotPage.getBidStatus();

    expect(
      bidStatus.label,
      `Expected a supported bidding state, received "${bidStatus.label}"`,
    ).toMatch(/^(Current bid|Starting bid)$/);

    expect(bidStatus.amount).toMatch(/^€\s*\d[\d.,\s]*$/);

    console.table({
      title: selectedTitle,
      favouritesCount: favourites,
      bidStatus: bidStatus.label,
      bidAmount: bidStatus.amount,
    });
  });
});

test(`second ${keyword} result remains usable in normal view @e2e @view-mode`, async ({
  page,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);

  await test.step(`Open Catawiki and search for ${keyword}`, async () => {
    await searchPage.goto();
    await searchPage.searchFor(keyword);

    await expect(page).toHaveURL(new RegExp(`/en/s\\?q=${keyword}`));
    await expect(searchResultsPage.getLot(1)).toBeVisible();
  });

  await test.step('Switch search results to normal view', async () => {
    await page.getByTestId('view-mode-normal').click();
  });

  await test.step('Inspect the second lot in normal view', async () => {
    const title = await searchResultsPage.getLotTitle(1);
    const lotId = await searchResultsPage.getLotId(1);

    console.log({
      title,
      lotId,
    });

    expect(title).toBeTruthy();
    expect(lotId).toBeTruthy();
  });

  await test.step('Open the second lot from normal view', async () => {
    const lotId = await searchResultsPage.getLotId(1);

    await searchResultsPage.openLot(1);

    await expect(page).toHaveURL(new RegExp(`/l/${lotId}`));
    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`/en/s\\?q=${keyword}`));

    await expect(
      searchResultsPage.getLot(1).locator('.c-extended-lot-card__title'),
    ).toBeVisible();

    await page.reload();

    await expect(
      searchResultsPage.getLot(1).locator('.c-extended-lot-card__title'),
    ).toBeVisible();
  });
});

test('user sees related objects when search has no exact results @e2e @negative', async ({
  page,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);

  await test.step('Open Catawiki landing page', async () => {
    await searchPage.goto();
  });

  await test.step('Search for a query with no exact matches', async () => {
    await searchPage.searchFor('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz');
  });

  await test.step('Validate no-exact-results fallback message', async () => {
    await expect(
      page.getByText('No exact results. Check out these related objects.'),
    ).toBeVisible();
  });

  await test.step('Validate related objects are displayed', async () => {
    await expect(searchResultsPage.lots.first()).toBeVisible();

    await expect(page.getByTestId('object-amount')).toContainText(
      'related objects',
    );
  });
});
