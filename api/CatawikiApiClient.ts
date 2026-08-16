import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Small read-only client for Catawiki JSON endpoints observed during normal
 * anonymous application usage.
 *
 * The client owns endpoint and request configuration while tests remain
 * responsible for contract and business assertions.
 */
export class CatawikiApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private readonly headers = {
    Accept: 'application/json',
  };

  /**
   * Retrieves a small page of lots from the default public feed.
   *
   * Primarily used to discover current production lot IDs dynamically rather
   * than relying on permanent fixtures.
   *
   * @returns Playwright API response for the feed request.
   */
  async getFeedLots(): Promise<APIResponse> {
    return this.request.get(
      '/buyer/api/v2/feeds/feeds_default/lots?per_page=9&page=1&locale=en',
      {
        headers: this.headers,
      },
    );
  }

  /**
   * Retrieves navigation metadata for a lot.
   *
   * @param lotId Numeric Catawiki lot identifier.
   * @returns Playwright API response containing lot navigation metadata.
   */
  async getLotNavigation(lotId: number): Promise<APIResponse> {
    return this.request.get(`/buyer/api/v3/lots/${lotId}/navigation`, {
      headers: this.headers,
    });
  }

  /**
   * Retrieves the current bidding state for a lot.
   *
   * @param lotId Numeric Catawiki lot identifier.
   * @returns Playwright API response containing bidding state for the requested lot.
   */
  async getBiddingState(lotId: number): Promise<APIResponse> {
    return this.request.get(`/buyer/api/v3/bidding/lots?ids=${lotId}`, {
      headers: this.headers,
    });
  }
}
