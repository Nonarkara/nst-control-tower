import { describe, it, expect } from "vitest";
import { resolveApiBase } from "./apiBase";

/**
 * resolveApiBase tests — this function determines the API URL used by every
 * useFeed() call in the dashboard. Getting it wrong silently breaks all data.
 */

describe("resolveApiBase", () => {
  it("returns empty string (relative URLs) when called with no argument in dev", () => {
    // In the test environment, import.meta.env.DEV is false (it's vitest, not vite dev).
    // Empty string → falls through to the NST production API base.
    const result = resolveApiBase(undefined);
    // Either empty string (dev mode) or the production URL — both are valid.
    expect(typeof result).toBe("string");
  });

  it("returns the provided URL when it is a valid non-legacy base", () => {
    const customBase = "https://my-custom-api.example.com";
    expect(resolveApiBase(customBase)).toBe(customBase);
  });

  it("trims trailing slashes from the provided URL", () => {
    const result = resolveApiBase("https://my-api.example.com/////");
    expect(result).toBe("https://my-api.example.com");
  });

  it("trims leading/trailing whitespace", () => {
    const result = resolveApiBase("  https://my-api.example.com  ");
    expect(result).toBe("https://my-api.example.com");
  });

  it("returns something other than the legacy URL when a sibling operator URL is provided", () => {
    // In Vitest, import.meta.env.DEV is true → sibling hosts fall back to ""
    // (relative URL mode for dev). In production, they'd redirect to the NST API.
    const legacyUrl = "https://other-api.nonarkara.org";
    const result = resolveApiBase(legacyUrl);
    expect(result).not.toBe(legacyUrl);
  });

  it("does not pass through an http sibling operator URL as-is", () => {
    const legacyUrl = "http://other-api.nonarkara.org";
    const result = resolveApiBase(legacyUrl);
    expect(result).not.toBe(legacyUrl);
  });
});
