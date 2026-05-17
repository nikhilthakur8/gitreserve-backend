import { simpleGit, type SimpleGit, type SimpleGitOptions } from "simple-git";

const DEFAULT_TIMEOUT = 300_000; // 5 min

export class GitCommandService {
  create(baseDir: string, timeout = DEFAULT_TIMEOUT): SimpleGit {
    const options: Partial<SimpleGitOptions> = {
      baseDir,
      binary: "git",
      maxConcurrentProcesses: 1,
      timeout: { block: timeout },
    };
    return simpleGit(options);
  }
}
