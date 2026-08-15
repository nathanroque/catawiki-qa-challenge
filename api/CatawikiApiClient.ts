import { APIRequestContext } from '@playwright/test';

export class CatawikiApiClient {
  constructor(
    private readonly request: APIRequestContext
  ) {}

  private readonly headers = {
    Accept: 'application/json',
  };

  async getFeedLots() {
    const response = await this.request.get(
      '/buyer/api/v2/feeds/feeds_default/lots?per_page=9&page=1&locale=en',
      {
        headers: this.headers,
      }
    );

    return response;
  }

  async getLotNavigation(lotId: number) {
    const response = await this.request.get(
      `/buyer/api/v3/lots/${lotId}/navigation`,
      {
        headers: this.headers,
      }
    );

    return response;
  }

  async getBiddingState(lotId: number) {
    const response = await this.request.get(
      `/buyer/api/v3/bidding/lots?ids=${lotId}`,
      {
        headers: this.headers,
      }
    );

    return response;
  }
}