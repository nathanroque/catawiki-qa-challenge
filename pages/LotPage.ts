import { Locator, Page } from '@playwright/test';

type BidStatus = {
  label: 'Current bid' | 'Starting bid';
  amount: string;
};

/**
 * Encapsulates read-only information exposed on a Catawiki lot details page.
 */
export class LotPage {
  constructor(private readonly page: Page) {}

  /**
   * Locator for the primary lot title heading.
   */
  get title() {
    return this.page.getByRole('heading', {
      level: 1,
    });
  }

  /**
   * Retrieves the favourite count currently displayed on the lot page.
   *
   * @returns Favourite count parsed as a non-negative integer.
   * @throws If the displayed favourite count is missing or not a valid integer.
   */
  async getFavouriteCount(): Promise<number> {
    const favouriteButton = this.page.getByTitle('favourite');

    await favouriteButton.waitFor({
      state: 'visible',
    });

    const favouriteText = (await favouriteButton.textContent())?.trim();

    if (!favouriteText || !/^\d+$/.test(favouriteText)) {
      throw new Error(`Invalid favourite count: ${favouriteText ?? 'missing'}`);
    }

    return Number(favouriteText);
  }

  /**
   * Retrieves the bidding state currently visible on the lot page.
   *
   * Responsive layouts may render more than one bid status representation
   * in the DOM at the same time. The method selects the visible status and
   * reads the amount associated with that representation.
   *
   * The bid state may represent either an active current bid
   * or a starting bid when no bids have been placed yet.
   *
   * @returns The visible bid status label and its associated amount.
   * @throws If no supported visible bid status or associated amount can be found.
   */
  async getBidStatus(): Promise<BidStatus> {
    const statusLabels = this.page.getByText(/^(Current bid|Starting bid)$/, {
      exact: true,
    });

    let statusLabel: Locator | undefined;

    for (let index = 0; index < (await statusLabels.count()); index++) {
      const candidate = statusLabels.nth(index);

      if (await candidate.isVisible()) {
        statusLabel = candidate;
        break;
      }
    }

    if (!statusLabel) {
      throw new Error('No visible current or starting bid status was found');
    }

    const label = (await statusLabel.textContent())?.trim();

    if (label !== 'Current bid' && label !== 'Starting bid') {
      throw new Error(`Unexpected bid status: ${label ?? 'missing'}`);
    }

    const amountLocator = statusLabel.locator('xpath=following-sibling::*[1]');

    await amountLocator.waitFor({
      state: 'visible',
    });

    const amount = (await amountLocator.textContent())?.trim();

    if (!amount) {
      throw new Error(`Bid amount was not found for status "${label}"`);
    }

    return {
      label,
      amount,
    };
  }
}
