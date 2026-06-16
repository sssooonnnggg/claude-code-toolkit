import { describe, it, expect } from "vitest";
import { encodeProjectDir } from "../src/pathEncoder";

describe("encodeProjectDir", () => {
  it("replaces drive colon and backslashes with single dashes", () => {
    expect(encodeProjectDir("C:\\Users\\me\\my-app")).toBe("C--Users-me-my-app");
  });
  it("preserves case of the drive letter", () => {
    expect(encodeProjectDir("D:\\Code\\App")).toBe("D--Code-App");
  });
  it("handles forward slashes", () => {
    expect(encodeProjectDir("c:/code/my-app")).toBe("c--code-my-app");
  });
  it("does not collapse separators or alter existing hyphens", () => {
    expect(encodeProjectDir("c:\\a-b\\c")).toBe("c--a-b-c");
  });
  it("replaces underscores with dashes (Claude encodes _ as -)", () => {
    expect(encodeProjectDir("C:\\Users\\me\\my_app\\src")).toBe("C--Users-me-my-app-src");
  });
  it("replaces any non-alphanumeric character with a dash", () => {
    expect(encodeProjectDir("c:\\proj\\a.b_c d\\e")).toBe("c--proj-a-b-c-d-e");
  });
});
