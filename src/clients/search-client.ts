import { AppConfig } from "../lib/config.js";
import { assertNoUpstreamError } from "../lib/data.js";
import { HttpClient } from "../lib/http.js";

export class TasoSearchClient {
  private readonly httpClient: HttpClient;

  constructor(config: AppConfig) {
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      acceptHeaderValue: config.acceptHeaderValue,
      timeoutMs: config.requestTimeoutMs,
    });
  }

  async search(text: string): Promise<unknown> {
    const response = await this.httpClient.get("search", { text });
    assertNoUpstreamError(response, "search");
    return response;
  }
}
