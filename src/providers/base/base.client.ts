import { ProviderApiError } from "@/providers/errors/provider.error.ts";

export interface BaseClientConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

export abstract class BaseClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: BaseClientConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = config.headers;
  }

  protected abstract extractErrorMessage(
    body: unknown,
    status: number,
  ): string;

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const init: RequestInit = { method: "POST" };
    if (body !== undefined) init.body = JSON.stringify(body);
    return this.request<T>(url, init);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const init: RequestInit = { method: "PATCH" };
    if (body !== undefined) init.body = JSON.stringify(body);
    return this.request<T>(url, init);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const init: RequestInit = { method: "PUT" };
    if (body !== undefined) init.body = JSON.stringify(body);
    return this.request<T>(url, init);
  }

  async delete(path: string, body?: unknown): Promise<void> {
    const url = this.buildUrl(path);
    const init: RequestInit = { method: "DELETE" };
    if (body !== undefined) init.body = JSON.stringify(body);
    await this.request(url, init);
  }

  private buildUrl(path: string, params?: Record<string, string | number>): URL {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    return url;
  }

  private async request<T = void>(url: URL, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: this.headers,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      const message = this.extractErrorMessage(errorBody, response.status);
      throw new ProviderApiError(message, response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
