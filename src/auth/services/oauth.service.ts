import axios from "axios";
import type { UserRepositoryPort } from "@/auth/db/user.repository.port.ts";
import type { OAuthProvider } from "@/auth/domain/user.entity.ts";
import type { AuthTokens } from "./auth.service.ts";
import { AuthService } from "./auth.service.ts";

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

interface OAuthUserInfo {
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string | undefined;
}

export class OAuthService {
  private readonly configs: Record<OAuthProvider, OAuthProviderConfig>;

  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly authService: AuthService,
    private readonly frontendUrl: string,
  ) {
    this.configs = {
      github: {
        clientId: process.env["GITHUB_AUTH_CLIENT_ID"] ?? "",
        clientSecret: process.env["GITHUB_AUTH_CLIENT_SECRET"] ?? "",
        redirectUri: process.env["GITHUB_AUTH_REDIRECT_URI"] ?? "",
        authorizationUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userInfoUrl: "https://api.github.com/user",
        scopes: ["user:email"],
      },
      google: {
        clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
        clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
        redirectUri: process.env["GOOGLE_AUTH_REDIRECT_URI"] ?? "",
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        scopes: ["email", "profile"],
      },
    };
  }

  getAuthorizationUrl(provider: OAuthProvider, state: string): string {
    const config = this.configs[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(" "),
      state,
      response_type: "code",
    });

    if (provider === "google") {
      params.set("access_type", "offline");
      params.set("prompt", "consent");
    }

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  async handleCallback(provider: OAuthProvider, code: string): Promise<{ redirectUrl: string }> {
    const config = this.configs[provider];

    const accessToken = await this.exchangeCode(provider, config, code);
    const userInfo = await this.fetchUserInfo(provider, accessToken);

    const tokens = await this.findOrCreateUser(provider, userInfo);

    const redirectUrl = `${this.frontendUrl}/auth/oauth/callback?token=${tokens.accessToken}&expiresIn=${tokens.expiresIn}`;
    return { redirectUrl };
  }

  private async exchangeCode(provider: OAuthProvider, config: OAuthProviderConfig, code: string): Promise<string> {
    const body = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    };

    const headers: Record<string, string> = { Accept: "application/json" };

    const response = await axios.post<Record<string, unknown>>(config.tokenUrl, body, { headers });
    const data = response.data;

    if (provider === "github") {
      return String(data["access_token"]);
    }
    return String(data["access_token"]);
  }

  private async fetchUserInfo(provider: OAuthProvider, accessToken: string): Promise<OAuthUserInfo> {
    if (provider === "github") {
      return this.fetchGitHubUser(accessToken);
    }
    return this.fetchGoogleUser(accessToken);
  }

  private async fetchGitHubUser(accessToken: string): Promise<OAuthUserInfo> {
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };

    const { data: profile } = await axios.get<Record<string, unknown>>(
      "https://api.github.com/user",
      { headers },
    );

    let email = profile["email"] as string | null;

    if (!email) {
      const { data: emails } = await axios.get<Array<{ email: string; primary: boolean; verified: boolean }>>(
        "https://api.github.com/user/emails",
        { headers },
      );
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? emails[0]?.email ?? null;
    }

    return {
      providerId: String(profile["id"]),
      email: email!,
      name: String(profile["name"] ?? profile["login"]),
      avatarUrl: profile["avatar_url"] as string | undefined,
    };
  }

  private async fetchGoogleUser(accessToken: string): Promise<OAuthUserInfo> {
    const { data } = await axios.get<Record<string, unknown>>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    return {
      providerId: String(data["id"]),
      email: String(data["email"]),
      name: String(data["name"]),
      avatarUrl: data["picture"] as string | undefined,
    };
  }

  private async findOrCreateUser(provider: OAuthProvider, info: OAuthUserInfo): Promise<AuthTokens> {
    let user = await this.userRepo.findByOAuthProvider(provider, info.providerId);

    if (user) {
      return this.authService.generateTokensForUser(user.id, user.email);
    }

    user = await this.userRepo.findByEmail(info.email);

    if (user) {
      await this.userRepo.linkOAuthAccount(user.id, {
        provider,
        providerId: info.providerId,
        email: info.email,
        avatarUrl: info.avatarUrl,
      });
      return this.authService.generateTokensForUser(user.id, user.email);
    }

    user = await this.userRepo.create({
      email: info.email.toLowerCase(),
      passwordHash: null,
      name: info.name,
      avatarUrl: info.avatarUrl,
      oauthAccounts: [
        {
          provider,
          providerId: info.providerId,
          email: info.email,
          avatarUrl: info.avatarUrl,
        },
      ],
    });

    return this.authService.generateTokensForUser(user.id, user.email);
  }
}
