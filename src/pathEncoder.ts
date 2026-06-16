/** Maps a workspace absolute path to its ~/.claude/projects subdirectory name. */
export function encodeProjectDir(workspacePath: string): string {
  return workspacePath.replace(/[:\\/]/g, "-");
}
