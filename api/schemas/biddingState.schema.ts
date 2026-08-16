import { expect } from '@playwright/test';

export function validateBiddingStateSchema(body: unknown) {
  expect(body).toBeTruthy();
  expect(typeof body).toBe('object');

  const response = body as Record<string, unknown>;

  expect(Array.isArray(response.lots)).toBeTruthy();
  expect(response.meta).toBeTruthy();
  expect(typeof response.meta).toBe('object');

  const lots = response.lots as unknown[];

  for (const lot of lots) {
    expect(lot).toBeTruthy();
    expect(typeof lot).toBe('object');

    const biddingLot = lot as Record<string, unknown>;

    expect(Number.isInteger(biddingLot.id)).toBeTruthy();
    expect(Number.isInteger(biddingLot.auction_id)).toBeTruthy();

    const currentBidAmount = biddingLot.current_bid_amount;

    expect(
      currentBidAmount === null || typeof currentBidAmount === 'object',
    ).toBeTruthy();

    if (currentBidAmount !== null && typeof currentBidAmount === 'object') {
      const amounts = currentBidAmount as Record<string, unknown>;

      expect(typeof amounts.EUR).toBe('number');
      expect(typeof amounts.USD).toBe('number');
      expect(typeof amounts.GBP).toBe('number');

      expect(amounts.EUR).toBeGreaterThanOrEqual(0);
      expect(amounts.USD).toBeGreaterThanOrEqual(0);
      expect(amounts.GBP).toBeGreaterThanOrEqual(0);
    }

    expect(Number.isInteger(biddingLot.favorite_count)).toBeTruthy();

    expect(biddingLot.favorite_count as number).toBeGreaterThanOrEqual(0);

    const biddingStart = Date.parse(biddingLot.bidding_start_time as string);

    const biddingEnd = Date.parse(biddingLot.bidding_end_time as string);

    expect(biddingStart).not.toBeNaN();
    expect(biddingEnd).not.toBeNaN();
    expect(biddingStart).toBeLessThan(biddingEnd);

    expect(typeof biddingLot.closed).toBe('boolean');
  }

  const meta = response.meta as Record<string, unknown>;

  expect(typeof meta.time).toBe('number');
}
