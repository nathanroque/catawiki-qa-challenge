import { expect } from '@playwright/test';

export function validateLotNavigationSchema(body: unknown) {
  expect(body).toBeTruthy();
  expect(typeof body).toBe('object');

  const navigation = body as Record<string, unknown>;

  expect(typeof navigation.source).toBe('string');
  expect((navigation.source as string).length).toBeGreaterThan(0);

  expect(
    navigation.previous_lot_id === null ||
      (Number.isInteger(navigation.previous_lot_id) &&
        (navigation.previous_lot_id as number) > 0),
  ).toBeTruthy();

  expect(
    navigation.next_lot_id === null ||
      (Number.isInteger(navigation.next_lot_id) &&
        (navigation.next_lot_id as number) > 0),
  ).toBeTruthy();

  expect(Number.isInteger(navigation.current_position)).toBeTruthy();
  expect(navigation.current_position as number).toBeGreaterThan(0);

  expect(Number.isInteger(navigation.total_lots)).toBeTruthy();
  expect(navigation.total_lots as number).toBeGreaterThan(0);
}
