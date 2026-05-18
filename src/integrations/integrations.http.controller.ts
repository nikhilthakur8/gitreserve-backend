import type { Request, Response, NextFunction } from "express";
import { createIntegrationHandler } from "@/integrations/services/integration-handler.factory.ts";
import { BaseOAuthIntegrationService } from "@/integrations/services/base-oauth-integration.service.ts";
import { mapIntegrationToResponse } from "@/integrations/integrations.mapper.ts";
import { IntegrationError } from "@/integrations/errors/integration.error.ts";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { IntegrationType } from "@/common/types.ts";
import { INTEGRATION_TYPES } from "@/integrations/domain/integration.enums.ts";
import { INTEGRATION_ERROR_STATUS_MAP } from "@/integrations/integrations.constants.ts";

const VALID_TYPES = new Set<string>(INTEGRATION_TYPES);

export class IntegrationController {
  constructor(private readonly repo: IntegrationRepositoryPort) {}

  private resolveHandler(req: AppRequest) {
    const { type } = req.params;
    if (!type || !VALID_TYPES.has(type)) {
      throw new IntegrationError(
        `Unsupported integration type: ${type}`,
        type as IntegrationType,
        "OAUTH_FAILED",
      );
    }
    return createIntegrationHandler(type as IntegrationType, this.repo);
  }

  async list(req: AppRequest) {
    const userId = req.userId!;
    const integrations = await this.repo.findMany({ userId });
    return ApiResponse.ok(integrations.map(mapIntegrationToResponse));
  }

  async getOAuthUrl(req: AppRequest) {
    const handler = this.resolveHandler(req);
    if (!("getAuthorizationUrl" in handler)) {
      throw new IntegrationError(
        `OAuth not supported for type: ${req.params["type"]}`,
        req.params["type"] as IntegrationType,
        "OAUTH_FAILED",
      );
    }
    const state = crypto.randomUUID();
    const url = (handler as BaseOAuthIntegrationService).getAuthorizationUrl(state);
    return ApiResponse.ok({ url, state });
  }

  async connect(req: AppRequest) {
    const handler = this.resolveHandler(req);
    const userId = req.userId!;

    const integration = await handler.connect(userId, req.body);

    return ApiResponse.created(mapIntegrationToResponse(integration));
  }

  async disconnect(req: AppRequest) {
    const handler = this.resolveHandler(req);
    const userId = req.userId!;

    await handler.disconnect(userId);

    return ApiResponse.noContent();
  }

  async verify(req: AppRequest) {
    const handler = this.resolveHandler(req);
    const userId = req.userId!;

    const integration = await handler.verify(userId);

    return ApiResponse.ok(mapIntegrationToResponse(integration));
  }

  handleError = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof IntegrationError) {
      res.status(INTEGRATION_ERROR_STATUS_MAP[err.code] ?? 500).json({
        error: err.message,
        code: err.code,
        type: err.type,
      });
      return;
    }

    console.error("Unhandled integration error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  };
}
