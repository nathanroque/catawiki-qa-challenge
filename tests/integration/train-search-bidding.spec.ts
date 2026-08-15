import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';

test('second Train search lot has consistent bidding API state @api @integration', async ({
  page,
  request,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);

  await searchPage.goto();
  await searchPage.searchFor('Train');

  expect(await searchResultsPage.lots.count())
    .toBeGreaterThan(1);

  const href = await searchResultsPage.getLotHref(1);

  expect(href).toBeTruthy();

  const lotIdMatch = href!.match(/\/l\/(\d+)/);

  expect(lotIdMatch).toBeTruthy();

  const lotId = Number(lotIdMatch![1]);

  const biddingResponse = await request.get(
    `/buyer/api/v3/bidding/lots?ids=${lotId}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  expect(biddingResponse.ok()).toBeTruthy();

  const body = await biddingResponse.json();

  expect(Array.isArray(body.lots)).toBeTruthy();

  const biddingLot = body.lots.find(
    (lot: { id: number }) => lot.id === lotId
  );

  expect(biddingLot).toBeTruthy();

  expect(biddingLot.id).toBe(lotId);

  expect(Number.isInteger(biddingLot.favorite_count))
    .toBeTruthy();

  expect(biddingLot.favorite_count)
    .toBeGreaterThanOrEqual(0);

  const biddingStart =
    Date.parse(biddingLot.bidding_start_time);

  const biddingEnd =
    Date.parse(biddingLot.bidding_end_time);

  expect(biddingStart).not.toBeNaN();
  expect(biddingEnd).not.toBeNaN();
  expect(biddingStart).toBeLessThan(biddingEnd);

  console.table({
    searchTerm: 'Train',
    selectedPosition: 2,
    lotId,
    favouriteCount: biddingLot.favorite_count,
    auctionId: biddingLot.auction_id,
  });
});