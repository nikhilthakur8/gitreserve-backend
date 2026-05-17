import { join } from "node:path";

export function buildStorageKey(storagePath: string, filename = "latest.bundle"): string {
  return join(storagePath, filename);
}

export function buildCloneDir(tempDir: string, repoName: string): string {
  return join(tempDir, repoName);
}

export function buildBundlePath(tempDir: string, repoName: string): string {
  return join(tempDir, `${repoName}.bundle`);
}
