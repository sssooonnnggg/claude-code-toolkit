import { describe, it, expect } from "vitest";
import { encodeProjectDir } from "../src/pathEncoder";

describe("encodeProjectDir", () => {
  it("replaces drive colon and backslashes with single dashes", () => {
    expect(encodeProjectDir("f:\\P4\\claude-extension")).toBe("f--P4-claude-extension");
  });
  it("preserves case of the drive letter", () => {
    expect(encodeProjectDir("F:\\P4\\w3\\Client")).toBe("F--P4-w3-Client");
  });
  it("handles forward slashes", () => {
    expect(encodeProjectDir("d:/P4/unity-mcp")).toBe("d--P4-unity-mcp");
  });
  it("does not collapse separators or alter existing hyphens", () => {
    expect(encodeProjectDir("f:\\a-b\\c")).toBe("f--a-b-c");
  });
  it("replaces underscores with dashes (Claude encodes _ as -)", () => {
    expect(encodeProjectDir("F:\\P4\\songruining_ngame\\Server")).toBe("F--P4-songruining-ngame-Server");
  });
  it("replaces any non-alphanumeric character with a dash", () => {
    expect(encodeProjectDir("f:\\P4\\a.b_c d\\e")).toBe("f--P4-a-b-c-d-e");
  });
});
