/**
 * Maps a workspace absolute path to its ~/.claude/projects subdirectory name.
 * Claude Code replaces every non-alphanumeric character (drive colon, slashes,
 * underscores, dots, spaces, ...) with a dash, e.g.
 * `C:\Users\me\my_app` -> `C--Users-me-my-app`.
 */
export function encodeProjectDir(workspacePath: string): string {
  return workspacePath.replace(/[^a-zA-Z0-9]/g, "-");
}
