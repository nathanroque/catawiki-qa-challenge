import { test, expect } from '@playwright/test';

test('user can search for Train and inspect the second lot @smoke @e2e', async ({ page }) => {
    await page.goto('/');

    const header = page.getByRole('banner');

    const searchInput = header.getByRole('combobox', {
            name: 'Search for brand, model, artist...',
        });

    const searchButton = header.getByRole('button', {
            name: 'Search',
        });

    await searchInput.fill('Train');
    await searchButton.click();

    const lots = page.locator(
            '[data-testid^="lot-card-container-"]'
        );

    expect(await lots.count()).toBeGreaterThan(1);
    
    const secondLot = lots.nth(1);

    const selectedTitle = await secondLot
        .locator('.c-lot-card__title')
        .textContent();

    const lotLink = secondLot.getByRole('link');

    const href = await lotLink.getAttribute('href');

    expect(selectedTitle).toBeTruthy();
    expect(href).toBeTruthy();

    const lotId = href?.match(/\/l\/(\d+)/)?.[1];

    expect(lotId).toBeTruthy();

    await lotLink.click();

    await expect(page).toHaveURL(new RegExp(`/l/${lotId}`));

    const lotTitle = page.getByRole('heading', { level: 1 });

    await expect(lotTitle).toHaveText(selectedTitle!.trim());

    const favouriteButton = page.getByTitle('favourite').first();

    const favouriteText = await favouriteButton.textContent();

    expect(favouriteText).toBeTruthy();

    const favourites = Number(favouriteText?.trim());

    expect(favourites).toBeGreaterThanOrEqual(0);

    const bidSection = page.getByTestId('lot-bid-status-section');

    await expect(
            bidSection.getByText('Current bid')
        ).toBeVisible();

    const bidText = await bidSection.textContent();

    const currentBid = bidText?.match(/€\s*\d[\d,.]*/)?.[0];

    expect(currentBid).toBeTruthy();

    console.table({
            title: selectedTitle?.trim(),
            favourites,
            currentBid,
        });
});