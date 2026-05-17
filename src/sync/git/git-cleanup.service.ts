import { createChildLogger } from "@/common/logger.ts";
import { removeTempDir } from "../utils/temp-dir.ts";

const logger = createChildLogger("git-cleanup");

export class GitCleanupService {
  async cleanup(tempDir: string): Promise<void> {
    try {
      await removeTempDir(tempDir);
    } catch (err) {
      logger.warn({ err, tempDir }, "Failed to clean up temp directory");
    }
  }
}
