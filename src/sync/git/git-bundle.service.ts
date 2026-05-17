import { stat } from "node:fs/promises";
import { GitCommandService } from "./git-command.service.ts";
import { SyncError } from "../domain/sync.error.ts";
import { buildBundlePath } from "../utils/repo-path.ts";
import type { BundleResult } from "./git.types.ts";

export class GitBundleService {
  constructor(private readonly gitCmd: GitCommandService) {}

  async createBundle(cloneDir: string, tempDir: string, repoName: string): Promise<BundleResult> {
    const bundlePath = buildBundlePath(tempDir, repoName);

    try {
      const git = this.gitCmd.create(cloneDir);
      await git.raw(["bundle", "create", bundlePath, "--all"]);

      const stats = await stat(bundlePath);

      return {
        bundlePath,
        sizeBytes: stats.size,
      };
    } catch (err) {
      throw new SyncError("Failed to create git bundle", "BUNDLE_FAILED", err);
    }
  }
}
