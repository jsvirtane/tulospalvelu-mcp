import { AppConfig } from "./config.js";
import { UpstreamError } from "./errors.js";

type QueryValue = string | number | boolean | undefined | null | string[];

export class HttpClient {
  private readonly baseUrl: string;
  private readonly acceptHeaderValue: string;
  private readonly timeoutMs: number;
  private readonly defaultQuery: Record<string, string>;

  constructor(options: {
    baseUrl: string;
    acceptHeaderValue: string;
    timeoutMs: AppConfig["requestTimeoutMs"];
    defaultQuery?: Record<string, string>;
  }) {
    this.baseUrl = options.baseUrl;
    this.acceptHeaderValue = options.acceptHeaderValue;
    this.timeoutMs = options.timeoutMs;
    this.defaultQuery = options.defaultQuery ?? {};
  }

  async get(path: string, query: Record<string, QueryValue> = {}): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/${path}`);

    for (const [key, value] of Object.entries(this.defaultQuery)) {
      url.searchParams.set(key, value);
    }

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          url.searchParams.set(key, value.join(","));
        }

        continue;
      }

      url.searchParams.set(key, typeof value === "boolean" ? String(Number(value)) : String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: this.acceptHeaderValue,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new UpstreamError(
          `Upstream request failed with ${response.status} ${response.statusText}${responseText ? `: ${responseText}` : ""}`,
          { endpoint: path, statusCode: response.status },
        );
      }

      return (await response.json()) as unknown;
    } catch (error) {
      if (error instanceof UpstreamError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new UpstreamError(`Upstream request timed out after ${this.timeoutMs}ms.`, { endpoint: path });
      }

      throw new UpstreamError(
        error instanceof Error ? error.message : "Unknown upstream request error.",
        { endpoint: path },
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
