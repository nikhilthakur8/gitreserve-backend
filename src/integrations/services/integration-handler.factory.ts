import type { IntegrationType } from "@/common/types.ts";
import type { IntegrationHandler } from "@/integrations/interfaces/integration-handler.interface.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import { GithubIntegrationService } from "./github-integration.service.ts";
import { GitlabIntegrationService } from "./gitlab-integration.service.ts";
import { StorageIntegrationService } from "./storage-integration.service.ts";
import { IntegrationError } from "@/integrations/errors/integration.error.ts";

const handlerFactories: Record<IntegrationType, (repo: IntegrationRepositoryPort) => IntegrationHandler> = {
  github: (repo) => new GithubIntegrationService(repo),
  gitlab: (repo) => new GitlabIntegrationService(repo),
  s3: (repo) => new StorageIntegrationService(repo, "s3"),
  r2: (repo) => new StorageIntegrationService(repo, "r2"),
};

export function createIntegrationHandler(
  type: IntegrationType,
  repo: IntegrationRepositoryPort,
): IntegrationHandler {
  const factory = handlerFactories[type];
  if (!factory) {
    throw new IntegrationError(
      `Unsupported integration type: ${type}`,
      type,
      "OAUTH_FAILED",
    );
  }
  return factory(repo);
}
