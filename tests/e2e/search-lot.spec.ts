import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/SearchPage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { LotPage } from '../../pages/LotPage';

test('user can search for Train and inspect the second lot @smoke @e2e', async ({ page }) => {
    const searchPage = new SearchPage(page);
    const searchResultsPage = new SearchResultsPage(page);
    const lotPage = new LotPage(page);
    
    await searchPage.goto();

    await searchPage.searchFor('Train');

    expect(
        await searchResultsPage.lots.count()
    ).toBeGreaterThan(1);
    
    const selectedTitle = await searchResultsPage.getLotTitle(1);

    expect(selectedTitle).toBeTruthy();

    const lotId = await searchResultsPage.getLotId(1);

    expect(lotId).toBeTruthy();

    await searchResultsPage.openLot(1);

    await expect(page).toHaveURL(new RegExp(`/l/${lotId}`));

    await expect(lotPage.title).toHaveText(selectedTitle!.trim());

    const favourites = await lotPage.getFavouriteCount();

    expect(favourites).toBeGreaterThanOrEqual(0);

    const currentBid = await lotPage.getCurrentBid();

    expect(currentBid).toBeTruthy();

    console.table({
            title: selectedTitle?.trim(),
            favourites,
            currentBid,
        });
});

test('user sees related objects when search has no exact results @e2e @negative', async ({page}) => {

    const searchPage = new SearchPage(page);
    const searchResultsPage = new SearchResultsPage(page);

    await searchPage.goto();

    await searchPage.searchFor(
        'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
    );

    await expect(
    page.getByText(
        'No exact results. Check out these related objects.'
    )
    ).toBeVisible();

    expect(
    await searchResultsPage.lots.count()
    ).toBeGreaterThan(0);

    await expect(
    page.getByTestId('object-amount')
    ).toContainText('related objects');
});