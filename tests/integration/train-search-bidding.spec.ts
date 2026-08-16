import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { LotPage } from '../../pages/LotPage';
import { CatawikiApiClient } from '../../api/CatawikiApiClient';
import { validateBiddingStateSchema } from '../../api/schemas/biddingState.schema';

function parseEuroAmount(amount: string): number {
  const numericValue = Number(amount.replace('€', '').replace(/,/g, '').trim());

  if (Number.isNaN(numericValue)) {
    throw new Error(`Unable to parse euro amount: "${amount}"`);
  }

  return numericValue;
}

test('second Train search lot has consistent bidding API state @api @integration', async ({
  page,
  request,
}) => {
  const searchPage = new SearchPage(page);
  const searchResultsPage = new SearchResultsPage(page);
  const lotPage = new LotPage(page);
  const api = new CatawikiApiClient(request);

  const lotId =
    await test.step('Search for "Train" and open the second lot', async () => {
      await searchPage.goto();
      await searchPage.searchFor('Train');

      await expect(page).toHaveURL(/\/en\/s\?q=Train/);

      await expect(searchResultsPage.getLot(1)).toBeVisible();

      const selectedLotId = await searchResultsPage.getLotId(1);

      await searchResultsPage.openLot(1);

      await expect(page).toHaveURL(new RegExp(`/en/l/${selectedLotId}`));

      await expect(lotPage.title).toBeVisible();

      return selectedLotId;
    });

  const uiState =
    await test.step('Capture bidding state displayed in the UI', async () => {
      const favouriteCount = await lotPage.getFavouriteCount();

      const bidStatus = await lotPage.getBidStatus();

      return {
        favouriteCount,
        bidStatus,
      };
    });

  const body =
    await test.step('Request bidding state for the selected lot', async () => {
      const biddingResponse = await api.getBiddingState(lotId);

      if (!biddingResponse.ok()) {
        throw new Error(
          `Bidding request failed: ${biddingResponse.status()} ${biddingResponse.statusText()}\n` +
            (await biddingResponse.text()),
        );
      }

      return biddingResponse.json();
    });

  await test.step('Validate bidding response contract', async () => {
    validateBiddingStateSchema(body);
  });

  await test.step('Validate UI and API bidding consistency', async () => {
    const biddingLot = body.lots.find(
      (lot: { id: number }) => lot.id === lotId,
    );

    expect(
      biddingLot,
      `Expected bidding API response to contain lot ${lotId}`,
    ).toBeTruthy();

    expect(biddingLot.id).toBe(lotId);

    expect(biddingLot.favorite_count).toBe(uiState.favouriteCount);

    expect(
      uiState.bidStatus.label,
      'Expected the selected lot to have a current bid for UI/API comparison',
    ).toBe('Current bid');

    expect(
      biddingLot.current_bid_amount,
      'Expected API to expose a current bid amount',
    ).not.toBeNull();

    const uiCurrentBid = parseEuroAmount(uiState.bidStatus.amount);

    expect(biddingLot.current_bid_amount.EUR).toBe(uiCurrentBid);

    console.table({
      lotId,
      uiFavouriteCount: uiState.favouriteCount,
      apiFavouriteCount: biddingLot.favorite_count,
      uiCurrentBid: uiState.bidStatus.amount,
      apiCurrentBidEUR: biddingLot.current_bid_amount.EUR,
    });
  });
});
