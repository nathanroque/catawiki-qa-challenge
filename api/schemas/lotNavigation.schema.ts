import { expect } from '@playwright/test';

export function validateLotNavigationSchema(body: unknown) {
  expect(body).toBeTruthy();
  expect(typeof body).toBe('object');

  const navigation = body as Record<string, unknown>;

  expect(typeof navigation.source).toBe('string');

  expect(
    navigation.previous_lot_id === null ||
      Number.isInteger(navigation.previous_lot_id),
  ).toBeTruthy();

  expect(
    navigation.next_lot_id === null || Number.isInteger(navigation.next_lot_id),
  ).toBeTruthy();

  expect(Number.isInteger(navigation.current_position)).toBeTruthy();

  expect(Number.isInteger(navigation.total_lots)).toBeTruthy();
}
