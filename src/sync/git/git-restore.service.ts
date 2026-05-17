import { GitCommandService } from "./git-command.service.ts";
import { SyncError } from "../domain/sync.error.ts";

export class GitRestoreService {
  constructor(private readonly gitCmd: GitCommandService) {}

  async restoreFromBundle(bundlePath: string, targetDir: string): Promise<string> {
    try {
      const git = this.gitCmd.create(targetDir);
      await git.clone(bundlePath, targetDir, ["--mirror"]);
      return targetDir;
    } catch (err) {
      throw new SyncError("Failed to restore from bundle", "CLONE_FAILED", err);
    }
  }

  async verifyBundle(bundlePath: string, workDir: string): Promise<boolean> {
    try {
      const git = this.gitCmd.create(workDir);
      await git.raw(["bundle", "verify", bundlePath]);
      return true;
    } catch {
      return false;
    }
  }
}
