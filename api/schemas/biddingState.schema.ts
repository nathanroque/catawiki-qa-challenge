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

    expect(
      biddingLot.current_bid_amount === null ||
      typeof biddingLot.current_bid_amount === 'object'
    ).toBeTruthy();

    expect(Number.isInteger(biddingLot.favorite_count))
      .toBeTruthy();

    expect(typeof biddingLot.bidding_start_time)
      .toBe('string');

    expect(typeof biddingLot.bidding_end_time)
      .toBe('string');

    expect(typeof biddingLot.closed)
      .toBe('boolean');
  }

  const meta = response.meta as Record<string, unknown>;

  expect(typeof meta.time).toBe('number');
}