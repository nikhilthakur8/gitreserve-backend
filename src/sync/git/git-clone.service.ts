import { GitCommandService } from "./git-command.service.ts";
import { SyncError } from "../domain/sync.error.ts";
import { buildCloneDir } from "../utils/repo-path.ts";
import type { CloneResult } from "./git.types.ts";

export class GitCloneService {
  constructor(private readonly gitCmd: GitCommandService) {}

  async clone(cloneUrl: string, tempDir: string, repoName: string): Promise<CloneResult> {
    const cloneDir = buildCloneDir(tempDir, repoName);

    try {
      const git = this.gitCmd.create(tempDir);
      await git.clone(cloneUrl, cloneDir, ["--mirror"]);

      const repoGit = this.gitCmd.create(cloneDir);
      const log = await repoGit.log({ maxCount: 1 });
      const latest = log.latest;

      return {
        cloneDir,
        commitSha: latest?.hash ?? "unknown",
        branch: await this.getDefaultBranch(repoGit),
        commitMessage: latest?.message ?? null,
        commitAuthor: latest?.author_name ?? null,
      };
    } catch (err) {
      throw new SyncError("Failed to clone repository", "CLONE_FAILED", err);
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
