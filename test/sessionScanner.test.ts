import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { titleOf, scanSessions } from "../src/sessionScanner";

function userText(text: string): string {
  return JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text }] } });
}
function userImage(): string {
  return JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "image", source: { type: "base64", data: "AAA" } }] } });
}
function assistant(text: string): string {
  return JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text }] } });
}

describe("titleOf", () => {
  it("returns the first human text prompt", () => {
    const jsonl = [userText("Add a pin feature"), assistant("Sure")].join("\n");
    expect(titleOf(jsonl)).toBe("Add a pin feature");
  });
  it("skips image-only and system-injected user messages", () => {
    const jsonl = [
      userImage(),
      userText("<ide_opened_file>some file</ide_opened_file>"),
      userText("<system-reminder>noise</system-reminder>"),
      userText("Real question here"),
    ].join("\n");
    expect(titleOf(jsonl)).toBe("Real question here");
  });
  it("collapses whitespace and truncates long titles", () => {
    const long = "word ".repeat(40).trim();
    const out = titleOf(userText(long));
    expect(out.length).toBeLessThanOrEqual(60);
  });
  it("tolerates malformed lines", () => {
    const jsonl = ["{not json", userText("After bad line")].join("\n");
    expect(titleOf(jsonl)).toBe("After bad line");
  });
  it("returns empty string when no human prompt exists", () => {
    expect(titleOf([userImage(), assistant("hi")].join("\n"))).toBe("");
  });
  it("handles string content (not array)", () => {
    const jsonl = JSON.stringify({ type: "user", message: { role: "user", content: "Plain string prompt" } });
    expect(titleOf(jsonl)).toBe("Plain string prompt");
  });
});

describe("scanSessions", () => {
  let dir: string;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "csp-")); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("returns [] for a missing directory", async () => {
    expect(await scanSessions(path.join(dir, "nope"))).toEqual([]);
  });

  it("reads sessions and sorts by mtime descending with fallback titles", async () => {
    const older = path.join(dir, "11111111-1111-1111-1111-111111111111.jsonl");
    const newer = path.join(dir, "22222222-2222-2222-2222-222222222222.jsonl");
    fs.writeFileSync(older, userText("Older session"));
    fs.writeFileSync(newer, userImage()); // no human text -> fallback title
    fs.utimesSync(older, new Date(1000), new Date(1000));
    fs.utimesSync(newer, new Date(2000), new Date(2000));

    const out = await scanSessions(dir);
    expect(out.map((s) => s.sessionId)).toEqual([
      "22222222-2222-2222-2222-222222222222",
      "11111111-1111-1111-1111-111111111111",
    ]);
    expect(out[1].title).toBe("Older session");
    expect(out[0].title).toContain("22222222"); // fallback includes short id
  });
});
