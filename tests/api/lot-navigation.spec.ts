import { test, expect } from '@playwright/test';
import { CatawikiApiClient } from '../../api/CatawikiApiClient';
import { validateLotNavigationSchema } from '../../api/schemas/lotNavigation.schema';

test('auction navigation remains internally consistent @api', async ({
  request,
}) => {
  const api = new CatawikiApiClient(request);

  const { originalLotId, originalNavigation } = await test.step(
    'Discover a current lot with an adjacent lot',
    async () => {
      const feedResponse = await api.getFeedLots();
      expect(feedResponse.ok()).toBeTruthy();

      const feedBody = await feedResponse.json();
      expect(feedBody.lots.length).toBeGreaterThan(0);

      for (const lot of feedBody.lots) {
        const navigationResponse = await api.getLotNavigation(lot.id);

        if (!navigationResponse.ok()) {
          continue;
        }

        const navigation = await navigationResponse.json();
        validateLotNavigationSchema(navigation);

        if (navigation.next_lot_id !== null) {
          return {
            originalLotId: lot.id,
            originalNavigation: navigation,
          };
        }
      }

      throw new Error('Could not find a feed lot with an adjacent lot');
    }
  );

  await test.step('Validate original lot navigation state', async () => {
    expect(originalNavigation.current_position)
      .toBeGreaterThanOrEqual(1);

    expect(originalNavigation.total_lots)
      .toBeGreaterThan(0);

    expect(originalNavigation.current_position)
      .toBeLessThanOrEqual(originalNavigation.total_lots);
  });

  const nextNavigation = await test.step(
    'Request and validate next lot navigation contract',
    async () => {
      const nextLotId = originalNavigation.next_lot_id;

      const nextNavigationResponse =
        await api.getLotNavigation(nextLotId);

      expect(nextNavigationResponse.ok()).toBeTruthy();

      const nextNavigation = await nextNavigationResponse.json();
      validateLotNavigationSchema(nextNavigation);

      return nextNavigation;
    }
  );

  await test.step('Validate consistency between adjacent lots', async () => {
    expect(nextNavigation.current_position)
      .toBe(originalNavigation.current_position + 1);

    expect(nextNavigation.previous_lot_id)
      .toBe(originalLotId);

    expect(nextNavigation.total_lots)
      .toBe(originalNavigation.total_lots);

    console.table({
      originalLotId,
      originalPosition: originalNavigation.current_position,
      nextLotId: originalNavigation.next_lot_id,
      nextPosition: nextNavigation.current_position,
      totalLots: originalNavigation.total_lots,
    });
  });
});
