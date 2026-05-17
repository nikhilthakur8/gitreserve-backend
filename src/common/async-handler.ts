import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "@/common/api-response.ts";

export interface AppRequest {
  params: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  userId?: string | undefined;
  email?: string | undefined;
}

export interface AuthenticatedRequest extends AppRequest {
  userId: string;
  email: string;
}

type ControllerMethod = (req: AppRequest) => Promise<ApiResponse>;

function flattenParams(params: Record<string, string | string[]>): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    flat[key] = Array.isArray(value) ? value[0]! : value;
  }
  return flat;
}

export function asyncHandler(fn: ControllerMethod) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const appReq: AppRequest = {
      params: flattenParams(req.params as Record<string, string | string[]>),
      body: req.body,
      query: req.query as Record<string, string>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      userId: req.headers["x-user-id"] as string | undefined,
      email: req.headers["x-user-email"] as string | undefined,
    };

    fn(appReq)
      .then((result) => {
        if (result.status === 204) {
          res.status(204).end();
          return;
        }
        res.status(result.status).json(result.data);
      })
      .catch(next);
  };
}
