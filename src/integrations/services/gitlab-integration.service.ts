import type { ProviderType } from "@/common/types.ts";
import type { OAuthConfig } from "@/integrations/domain/integration.types.ts";
import { BaseOAuthIntegrationService } from "./base-oauth-integration.service.ts";

export class GitlabIntegrationService extends BaseOAuthIntegrationService {
  protected readonly providerType: ProviderType = "gitlab";
  protected readonly serverUrl = "https://gitlab.com";
  protected readonly scopeDelimiter = " ";
  protected readonly displayName = "GitLab";
  protected readonly oauthConfig: OAuthConfig = {
    clientId: process.env["GITLAB_CLIENT_ID"] ?? "",
    clientSecret: process.env["GITLAB_CLIENT_SECRET"] ?? "",
    redirectUri: process.env["GITLAB_REDIRECT_URI"] ?? "",
    scopes: ["api", "read_repository"],
    authorizationUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
  };
}
