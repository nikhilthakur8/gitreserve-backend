import axios, { type AxiosInstance, type AxiosRequestConfig, AxiosError } from "axios";
import { ProviderApiError } from "@/providers/errors/provider.error.ts";

export interface BaseClientConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

export abstract class BaseClient {
  protected readonly client: AxiosInstance;

  constructor(config: BaseClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers,
    });
  }

  protected abstract extractErrorMessage(
    body: unknown,
    status: number,
  ): string;

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    return this.request<T>({ method: "GET", url: path, params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", url: path, data: body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "PATCH", url: path, data: body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "PUT", url: path, data: body });
  }

  async delete(path: string, body?: unknown): Promise<void> {
    await this.request<void>({ method: "DELETE", url: path, data: body });
  }

  private async request<T = void>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);

      if (response.status === 204) {
        return undefined as T;
      }

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const message = this.extractErrorMessage(error.response.data, error.response.status);
        throw new ProviderApiError(message, error.response.status, error.response.data);
      }
      throw error;
    }
  }
}
