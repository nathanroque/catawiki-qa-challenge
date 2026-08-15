import { expect } from '@playwright/test';

export function validateLotNavigationSchema(body: unknown) {
  expect(body).toBeTruthy();
  expect(typeof body).toBe('object');

  const navigation = body as Record<string, unknown>;

  expect(typeof navigation.source).toBe('string');

  expect(
    navigation.previous_lot_id === null ||
    typeof navigation.previous_lot_id === 'number'
  ).toBeTruthy();

  expect(
    navigation.next_lot_id === null ||
    typeof navigation.next_lot_id === 'number'
  ).toBeTruthy();

  expect(Number.isInteger(navigation.current_position))
    .toBeTruthy();

  expect(Number.isInteger(navigation.total_lots))
    .toBeTruthy();
}