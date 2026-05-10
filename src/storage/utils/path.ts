export function buildObjectKey(owner: string, repo: string, filename: string): string {
  return `repos/${owner}/${repo}/${filename}`;
}
