import axios from "axios";
import { createProvider } from "@/providers/provider.factory.ts";
import type { ProviderType } from "@/common/types.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { Integration } from "@/integrations/domain/integration.entity.ts";
import type {
  OAuthConfig,
  OAuthCredentials,
  OAuthTokenResponse,
} from "@/integrations/domain/integration.types.ts";
import type { IntegrationHandler } from "@/integrations/interfaces/integration-handler.interface.ts";
import { IntegrationError } from "@/integrations/errors/integration.error.ts";

export abstract class BaseOAuthIntegrationService implements IntegrationHandler {
  protected abstract readonly providerType: ProviderType;
  protected abstract readonly serverUrl: string;
  protected abstract readonly scopeDelimiter: string;
  protected abstract readonly displayName: string;
  protected abstract readonly oauthConfig: OAuthConfig;

  constructor(protected readonly repo: IntegrationRepositoryPort) {}

  getAuthorizationUrl(state: string): string {
    const config = this.oauthConfig;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(" "),
      state,
      response_type: "code",
    });
    return `${config.authorizationUrl}?${params.toString()}`;
  }

  async connect(userId: string, payload: unknown): Promise<Integration> {
    const { code } = payload as { code: string };

    const existing = await this.repo.findOne({ userId, type: this.providerType });
    if (existing) {
      throw new IntegrationError(
        `${this.displayName} is already connected`,
        this.providerType,
        "ALREADY_CONNECTED",
      );
    }

    const tokenResponse = await this.exchangeCodeForToken(code);

    const credentials: OAuthCredentials = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresAt: tokenResponse.expiresIn
        ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
        : null,
      scopes: tokenResponse.scope.split(this.scopeDelimiter).filter(Boolean),
    };

    const provider = createProvider(this.providerType, { token: credentials.accessToken });
    const user = await provider.getAuthenticatedUser();

    return this.repo.create({
      userId,
      type: this.providerType,
      credentials,
      metadata: {
        username: user.login,
        avatarUrl: user.avatarUrl,
        email: user.email,
        serverUrl: this.serverUrl,
      },
    });
  }

  async disconnect(userId: string): Promise<void> {
    const integration = await this.findOrThrow(userId);
    await this.repo.delete(integration.id);
  }

  async verify(userId: string): Promise<Integration> {
    const integration = await this.findOrThrow(userId);
    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider(this.providerType, { token: credentials.accessToken });

    try {
      await provider.getAuthenticatedUser();
      return integration;
    } catch (error) {
      await this.repo.update(integration.id, { status: "error" });
      throw new IntegrationError(
        `${this.displayName} connection test failed`,
        this.providerType,
        "CONNECTION_TEST_FAILED",
        error,
      );
    }
  }

  private async findOrThrow(userId: string): Promise<Integration> {
    const integration = await this.repo.findOne({ userId, type: this.providerType });
    if (!integration) {
      throw new IntegrationError(
        `${this.displayName} integration not found`,
        this.providerType,
        "INTEGRATION_NOT_FOUND",
      );
    }
    return integration;
  }

  private async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const config = this.oauthConfig;

    let data: Record<string, unknown>;
    try {
      const response = await axios.post<Record<string, unknown>>(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }, {
        headers: { Accept: "application/json" },
      });
      data = response.data;
    } catch {
      throw new IntegrationError(
        "OAuth token exchange failed",
        this.providerType,
        "OAUTH_FAILED",
      );
    }

    if (data["error"]) {
      throw new IntegrationError(
        `OAuth error: ${String(data["error_description"] ?? data["error"])}`,
        this.providerType,
        "OAUTH_FAILED",
      );
    }

    return {
      accessToken: String(data["access_token"]),
      refreshToken: data["refresh_token"] ? String(data["refresh_token"]) : null,
      expiresIn: data["expires_in"] ? Number(data["expires_in"]) : null,
      tokenType: String(data["token_type"] ?? "bearer"),
      scope: String(data["scope"] ?? ""),
    };
  }
}
