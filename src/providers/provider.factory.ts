import type { GitProvider } from "@/providers/interfaces/git-provider.interface.ts";
import type { ProviderConfig, ProviderType } from "@/providers/provider.types.ts";
import { GithubProvider } from "@/providers/github/github.provider.ts";
import { GitlabProvider } from "@/providers/gitlab/gitlab.provider.ts";

const providerConstructors: Record<
  ProviderType,
  new (token: string, baseUrl?: string) => GitProvider
> = {
  github: GithubProvider,
  gitlab: GitlabProvider,
};

export function createProvider(
  type: ProviderType,
  config: ProviderConfig,
): GitProvider {
  const Constructor = providerConstructors[type];
  return new Constructor(config.token, config.baseUrl);
}
