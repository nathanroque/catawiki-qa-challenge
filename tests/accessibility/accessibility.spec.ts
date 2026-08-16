import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import {
  landingPageKnownViolationIds,
  searchResultsKnownViolationIds,
  lotDetailsKnownViolationIds,
} from './known-violations';

test.describe.configure({
  mode: 'serial',
  timeout: 60_000,
});

test(
  'landing page has no unexpected serious or critical accessibility violations @accessibility',
  async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step('Open Catawiki landing page', async () => {
      await searchPage.goto();
    });

    const highSeverityViolations = await test.step(
      'Run automated accessibility scan',
      async () => {
        const results = await new AxeBuilder({ page }).analyze();

        return results.violations.filter(
          violation =>
            violation.impact === 'serious' ||
            violation.impact === 'critical'
        );
      },
      { box: true }
    );

    await test.step('Report high-severity accessibility findings', async () => {
      console.table(
        highSeverityViolations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.help,
          affectedNodes: violation.nodes.length,
        }))
      );
    });

    await test.step(
      'Compare findings against known accessibility baseline',
      async () => {
        const unexpectedViolations =
          highSeverityViolations.filter(
            violation =>
              !landingPageKnownViolationIds.includes(
                violation.id
              )
          );

        expect(
          unexpectedViolations,
          'Expected no unexpected serious or critical accessibility violations'
        ).toHaveLength(0);
      }
    );
  }
);

test(
  'search results page has no unexpected serious or critical accessibility violations @accessibility',
  async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step('Open Catawiki landing page', async () => {
      await searchPage.goto();
    });

    await test.step('Search for "Train"', async () => {
      await searchPage.searchFor('Train');
    });

    const highSeverityViolations = await test.step(
      'Run automated accessibility scan on search results',
      async () => {
        const results = await new AxeBuilder({ page }).analyze();

        return results.violations.filter(
          violation =>
            violation.impact === 'serious' ||
            violation.impact === 'critical'
        );
      },
      { box: true }
    );

    await test.step(
      'Report high-severity accessibility findings',
      async () => {
        console.table(
          highSeverityViolations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.help,
            affectedNodes: violation.nodes.length,
          }))
        );
      }
    );

    await test.step(
      'Compare findings against known accessibility baseline',
      async () => {
        const unexpectedViolations =
          highSeverityViolations.filter(
            violation =>
              !searchResultsKnownViolationIds.includes(
                violation.id
              )
          );

        expect(
          unexpectedViolations,
          'Expected no unexpected serious or critical accessibility violations'
        ).toHaveLength(0);
      }
    );
  }
);

test(
  'lot details page has no unexpected serious or critical accessibility violations @accessibility',
  async ({ page }) => {
    const searchPage = new SearchPage(page);
    const searchResultsPage = new SearchResultsPage(page);

    await test.step('Open Catawiki landing page', async () => {
      await searchPage.goto();
    });

    await test.step('Search for "Train"', async () => {
      await searchPage.searchFor('Train');

    await expect(
      searchResultsPage.lots.first()
    ).toBeVisible();
    });

    await test.step('Open the second search result', async () => {
      await searchResultsPage.openLot(1);
    });

    await test.step('Validate lot details page is open', async () => {
      await expect(page).toHaveURL(/\/l\/\d+/);
    });

    const highSeverityViolations = await test.step(
      'Run automated accessibility scan on lot details page',
      async () => {
        const results = await new AxeBuilder({ page }).analyze();

        return results.violations.filter(
          violation =>
            violation.impact === 'serious' ||
            violation.impact === 'critical'
        );
      },
      { box: true }
    );

    await test.step(
      'Report high-severity accessibility findings',
      async () => {
        console.table(
          highSeverityViolations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.help,
            affectedNodes: violation.nodes.length,
          }))
        );
      }
    );

    await test.step(
      'Compare findings against known accessibility baseline',
      async () => {
        const unexpectedViolations =
          highSeverityViolations.filter(
            violation =>
              !lotDetailsKnownViolationIds.includes(
                violation.id
              )
          );

        expect(
          unexpectedViolations,
          'Expected no unexpected serious or critical accessibility violations'
        ).toHaveLength(0);
      }
    );
  }
);