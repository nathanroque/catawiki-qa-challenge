import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { CatawikiApiClient } from '../../api/CatawikiApiClient';
import { validateBiddingStateSchema } from '../../api/schemas/biddingState.schema';

test('second Train search lot has consistent bidding API state @api @integration', async ({
  page,
  request,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);
  const api = new CatawikiApiClient(request);

  const lotId = await test.step(
    'Search for "Train" and capture the second lot ID',
    async () => {
      await searchPage.goto();
      await searchPage.searchFor('Train');

      expect(await searchResultsPage.lots.count())
        .toBeGreaterThan(1);

      return searchResultsPage.getLotId(1);
    }
  );

  const body = await test.step(
    'Request bidding state for the selected lot',
    async () => {
      const biddingResponse =
        await api.getBiddingState(lotId);

      expect(biddingResponse.ok()).toBeTruthy();

      return biddingResponse.json();
    }
  );

  await test.step('Validate bidding response contract', async () => {
    validateBiddingStateSchema(body);
  });

  await test.step('Validate UI and API lot consistency', async () => {
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
});
