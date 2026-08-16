import { test, expect } from '@playwright/test';
import { validateBiddingStateSchema } from '../../api/schemas/biddingState.schema';

test.describe('validateBiddingStateSchema', () => {
  test('accepts a valid bidding response with current bid amounts', () => {
    const body = {
      lots: [
        {
          id: 106096956,
          auction_id: 1255949,
          current_bid_amount: {
            EUR: 57,
            USD: 66,
            GBP: 49,
          },
          favorite_count: 18,
          bidding_start_time: '2026-08-14T18:00:00Z',
          bidding_end_time: '2026-08-23T18:08:30Z',
          closed: false,
        },
      ],
      meta: {
        time: 1786918982,
      },
    };

    expect(() => validateBiddingStateSchema(body)).not.toThrow();
  });

  test('accepts a valid bidding response with no current bid', () => {
    const body = {
      lots: [
        {
          id: 106096956,
          auction_id: 1255949,
          current_bid_amount: null,
          favorite_count: 0,
          bidding_start_time: '2026-08-14T18:00:00Z',
          bidding_end_time: '2026-08-23T18:08:30Z',
          closed: false,
        },
      ],
      meta: {
        time: 1786918982,
      },
    };

    expect(() => validateBiddingStateSchema(body)).not.toThrow();
  });

  test('rejects an invalid favourite count', () => {
    const body = {
      lots: [
        {
          id: 106096956,
          auction_id: 1255949,
          current_bid_amount: {
            EUR: 57,
            USD: 66,
            GBP: 49,
          },
          favorite_count: -1,
          bidding_start_time: '2026-08-14T18:00:00Z',
          bidding_end_time: '2026-08-23T18:08:30Z',
          closed: false,
        },
      ],
      meta: {
        time: 1786918982,
      },
    };

    expect(() => validateBiddingStateSchema(body)).toThrow();
  });

  test('rejects malformed current bid amounts', () => {
    const body = {
      lots: [
        {
          id: 106096956,
          auction_id: 1255949,
          current_bid_amount: {
            EUR: '57',
            USD: 66,
            GBP: 49,
          },
          favorite_count: 18,
          bidding_start_time: '2026-08-14T18:00:00Z',
          bidding_end_time: '2026-08-23T18:08:30Z',
          closed: false,
        },
      ],
      meta: {
        time: 1786918982,
      },
    };

    expect(() => validateBiddingStateSchema(body)).toThrow();
  });

  test('rejects an invalid bidding time range', () => {
    const body = {
      lots: [
        {
          id: 106096956,
          auction_id: 1255949,
          current_bid_amount: {
            EUR: 57,
            USD: 66,
            GBP: 49,
          },
          favorite_count: 18,
          bidding_start_time: '2026-08-23T18:08:30Z',
          bidding_end_time: '2026-08-14T18:00:00Z',
          closed: false,
        },
      ],
      meta: {
        time: 1786918982,
      },
    };

    expect(() => validateBiddingStateSchema(body)).toThrow();
  });
});
