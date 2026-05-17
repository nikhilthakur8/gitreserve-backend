import type { SyncJobContext } from "../domain/sync.types.ts";
import type { SyncTrigger } from "../domain/sync.enums.ts";

export interface SyncJobPayload {
  jobId: string;
  trackedRepoId: string;
  trigger: SyncTrigger;
  context: SyncJobContext;
  commitSha?: string;
  commitMessage?: string;
  commitAuthor?: string;
}

export interface SqsConfig {
  queueUrl: string;
  region: string;
  endpoint?: string;
}
