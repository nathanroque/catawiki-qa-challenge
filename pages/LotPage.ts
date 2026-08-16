import { Page } from '@playwright/test';

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
   * Retrieves the bidding state currently displayed on the lot page.
   *
   * The bid section may represent either an active current bid
   * or a starting bid when no bids have been placed yet.
   *
   * @returns The displayed bid status label and its associated amount.
   * @throws If the bid status is unsupported or the associated amount cannot be found.
   */
  async getBidStatus(): Promise<BidStatus> {
    const bidSection = this.page.getByTestId('lot-bid-status-section');

    const statusLabel = bidSection.getByText(/^(Current bid|Starting bid)$/, {
      exact: true,
    });

    await statusLabel.waitFor({
      state: 'visible',
    });

    const label = (await statusLabel.textContent())?.trim();

    if (label !== 'Current bid' && label !== 'Starting bid') {
      throw new Error(`Unexpected bid status: ${label ?? 'missing'}`);
    }

    const amountLocator = statusLabel.locator(
      'xpath=following-sibling::div[1]',
    );

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
