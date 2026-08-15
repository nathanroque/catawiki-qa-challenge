import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SearchPage } from '../../pages/SearchPage';
import { landingPageKnownViolationIds } from './known-violations';

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