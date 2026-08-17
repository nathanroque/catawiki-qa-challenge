import { expect } from '@playwright/test';

/**
 * Validates the runtime shape and key invariants of a lot-navigation response.
 *
 * The validation is intentionally limited to the fields consumed by the
 * navigation tests, including source, adjacent lot identifiers, current
 * position and total lot count.
 *
 * Cross-response relationships, such as sequential positions and reverse
 * navigation references, are validated by the behavioral API test rather than
 * by this schema validator.
 *
 * @param body Unknown response payload returned by the lot-navigation endpoint.
 * @throws When a required consumed field has an unexpected type or invalid
 * value.
 */
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
