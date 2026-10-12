import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../infra/run-nst-api.sh");

describe("infra/run-nst-api.sh", () => {
  it("does not assign a provider credential", () => {
    const text = readFileSync(scriptPath, "utf8");
    expect(text).not.toMatch(/AIRLABS_API_KEY\s*=\s*\S+/);
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(text).not.toMatch(/\/Users\//);
  });
});

describe("apps/api/wrangler.toml", () => {
  it("does not commit a Cloudflare account id", () => {
    const tomlPath = resolve(dirname(fileURLToPath(import.meta.url)), "../wrangler.toml");
    const text = readFileSync(tomlPath, "utf8");
    expect(text).not.toMatch(/account_id\s*=/);
  });
});
