import { GitCommandService } from "./git-command.service.ts";
import { SyncError } from "../domain/sync.error.ts";
import type { FetchResult } from "./git.types.ts";

export class GitFetchService {
  constructor(private readonly gitCmd: GitCommandService) {}

  async fetch(cloneDir: string, previousSha: string | null): Promise<FetchResult> {
    try {
      const git = this.gitCmd.create(cloneDir);
      await git.fetch(["--all", "--prune"]);

      const log = await git.log({ maxCount: 1 });
      const latest = log.latest;
      const currentSha = latest?.hash ?? "unknown";

      return {
        commitSha: currentSha,
        branch: await this.getDefaultBranch(git),
        commitMessage: latest?.message ?? null,
        commitAuthor: latest?.author_name ?? null,
        hasChanges: previousSha !== currentSha,
      };
    } catch (err) {
      throw new SyncError("Failed to fetch repository updates", "FETCH_FAILED", err);
    }
  }

  private async getDefaultBranch(git: ReturnType<GitCommandService["create"]>): Promise<string> {
    try {
      const result = await git.raw(["symbolic-ref", "HEAD"]);
      return result.trim().replace("refs/heads/", "");
    } catch {
      return "main";
    }
  }
}
