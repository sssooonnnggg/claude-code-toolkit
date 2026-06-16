/**
 * Maps a workspace absolute path to its ~/.claude/projects subdirectory name.
 * Claude Code replaces every non-alphanumeric character (drive colon, slashes,
 * underscores, dots, spaces, ...) with a dash, e.g.
 * `F:\P4\songruining_ngame\Server` -> `F--P4-songruining-ngame-Server`.
 */
export function encodeProjectDir(workspacePath: string): string {
  return workspacePath.replace(/[^a-zA-Z0-9]/g, "-");
}
