import type { Request, Response, NextFunction } from "express";
import type { GithubWebhookHandler } from "./github-webhook.handler.ts";
import type { GitlabWebhookHandler } from "./gitlab-webhook.handler.ts";

export class WebhookController {
  constructor(
    private readonly githubWebhook: GithubWebhookHandler,
    private readonly gitlabWebhook: GitlabWebhookHandler,
  ) {}

  handleGithub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repoId = String(req.params["repoId"]);
      const rawBody = req.body as Buffer;
      await this.githubWebhook.handle(repoId, req.headers as Record<string, string | string[] | undefined>, rawBody);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };

  handleGitlab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repoId = String(req.params["repoId"]);
      const rawBody = req.body as Buffer;
      await this.gitlabWebhook.handle(repoId, req.headers as Record<string, string | string[] | undefined>, rawBody);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };
}
