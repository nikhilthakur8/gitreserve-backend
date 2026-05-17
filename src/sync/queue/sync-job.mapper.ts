import type { SyncJobPayload } from "./sync-job.types.ts";
import type { SyncJobContext } from "../domain/sync.types.ts";
import type { SyncTrigger } from "../domain/sync.enums.ts";

export function buildSyncJobPayload(
  jobId: string,
  trackedRepoId: string,
  trigger: SyncTrigger,
  context: SyncJobContext,
  commit?: { sha?: string; message?: string; author?: string },
): SyncJobPayload {
  const payload: SyncJobPayload = { jobId, trackedRepoId, trigger, context };
  if (commit?.sha) payload.commitSha = commit.sha;
  if (commit?.message) payload.commitMessage = commit.message;
  if (commit?.author) payload.commitAuthor = commit.author;
  return payload;
}
