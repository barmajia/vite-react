import { describe, it, expect } from "vitest";

describe("debug test", () => {
  it("basic test works", () => {
    expect(true).toBe(true);
  });

  it("import test", async () => {
    const mod = await import("../../lib/security-utils");
    expect(mod.generateSecureToken).toBeDefined();
    const token = mod.generateSecureToken(32);
    expect(token).toHaveLength(64);
  });
});
