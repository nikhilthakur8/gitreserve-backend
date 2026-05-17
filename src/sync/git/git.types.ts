export interface CloneResult {
  cloneDir: string;
  commitSha: string;
  branch: string;
  commitMessage: string | null;
  commitAuthor: string | null;
}

export interface BundleResult {
  bundlePath: string;
  sizeBytes: number;
}

export interface FetchResult {
  commitSha: string;
  branch: string;
  commitMessage: string | null;
  commitAuthor: string | null;
  hasChanges: boolean;
}
