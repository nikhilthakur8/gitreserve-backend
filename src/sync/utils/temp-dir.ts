import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PREFIX = "gitreserve-sync-";

export async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), PREFIX));
}

export async function removeTempDir(dirPath: string): Promise<void> {
  await rm(dirPath, { recursive: true, force: true });
}
