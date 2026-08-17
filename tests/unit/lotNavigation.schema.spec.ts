import { test, expect } from '@playwright/test';
import { validateLotNavigationSchema } from '../../api/schemas/lotNavigation.schema';

test.describe('validateLotNavigationSchema', () => {
  test('accepts a valid navigation response', () => {
    const body = {
      source: 'auction',
      previous_lot_id: 106096955,
      next_lot_id: 106096957,
      current_position: 2,
      total_lots: 50,
    };

    expect(() => validateLotNavigationSchema(body)).not.toThrow();
  });

  test('accepts null adjacent lot IDs', () => {
    const body = {
      source: 'auction',
      previous_lot_id: null,
      next_lot_id: null,
      current_position: 1,
      total_lots: 1,
    };

    expect(() => validateLotNavigationSchema(body)).not.toThrow();
  });

  test('rejects a non-integer previous lot ID', () => {
    const body = {
      source: 'auction',
      previous_lot_id: 106096955.5,
      next_lot_id: 106096957,
      current_position: 2,
      total_lots: 50,
    };

    expect(() => validateLotNavigationSchema(body)).toThrow();
  });

  test('rejects an invalid next lot ID type', () => {
    const body = {
      source: 'auction',
      previous_lot_id: 106096955,
      next_lot_id: '106096957',
      current_position: 2,
      total_lots: 50,
    };

    expect(() => validateLotNavigationSchema(body)).toThrow();
  });

  test('rejects non-positive navigation values', () => {
    const body = {
      source: 'auction',
      previous_lot_id: 0,
      next_lot_id: -1,
      current_position: 0,
      total_lots: -1,
    };

    expect(() => validateLotNavigationSchema(body)).toThrow();
  });

  test('rejects an empty navigation source', () => {
    const body = {
      source: '',
      previous_lot_id: null,
      next_lot_id: null,
      current_position: 1,
      total_lots: 1,
    };

    expect(() => validateLotNavigationSchema(body)).toThrow();
  });
});
