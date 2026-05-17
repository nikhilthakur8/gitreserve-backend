import type { ProviderType } from "@/common/types.ts";
import type { OAuthConfig } from "@/integrations/domain/integration.types.ts";
import { BaseOAuthIntegrationService } from "./base-oauth-integration.service.ts";

export class GithubIntegrationService extends BaseOAuthIntegrationService {
  protected readonly providerType: ProviderType = "github";
  protected readonly serverUrl = "https://github.com";
  protected readonly scopeDelimiter = ",";
  protected readonly displayName = "GitHub";
  protected readonly oauthConfig: OAuthConfig = {
    clientId: process.env["GITHUB_CLIENT_ID"] ?? "",
    clientSecret: process.env["GITHUB_CLIENT_SECRET"] ?? "",
    redirectUri: process.env["GITHUB_REDIRECT_URI"] ?? "",
    scopes: ["repo", "admin:repo_hook"],
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
  };
}
