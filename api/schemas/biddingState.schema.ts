import { expect } from '@playwright/test';

/**
 * Validates the runtime shape and key invariants of the bidding-state response
 * consumed by the automated tests.
 *
 * The validation is intentionally scoped to fields used by the suite, including
 * lot and auction identifiers, bid amounts, favourite count, bidding timestamps,
 * closed state and response metadata.
 *
 * This is a focused runtime contract check for the test suite and does not aim
 * to model or validate the complete provider response schema.
 *
 * @param body Unknown response payload returned by the bidding-state endpoint.
 * @throws When a required consumed field has an unexpected type, value or
 * relationship.
 */
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
    expect(biddingLot.id as number).toBeGreaterThan(0);

    expect(Number.isInteger(biddingLot.auction_id)).toBeTruthy();
    expect(biddingLot.auction_id as number).toBeGreaterThan(0);

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

    expect(typeof biddingLot.bidding_start_time).toBe('string');
    expect(typeof biddingLot.bidding_end_time).toBe('string');

    const biddingStart = Date.parse(biddingLot.bidding_start_time as string);

    const biddingEnd = Date.parse(biddingLot.bidding_end_time as string);

    expect(biddingStart).not.toBeNaN();
    expect(biddingEnd).not.toBeNaN();
    expect(biddingStart).toBeLessThan(biddingEnd);

    expect(typeof biddingLot.closed).toBe('boolean');
  }

  const meta = response.meta as Record<string, unknown>;

  expect(typeof meta.time).toBe('number');
  expect(Number.isFinite(meta.time)).toBeTruthy();
}
