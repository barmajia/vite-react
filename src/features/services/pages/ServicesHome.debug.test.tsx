/**
 * Simple debug test
 */
import { describe, it, expect } from "vitest";

describe("Debug", () => {
  it("should pass", () => {
    expect(1 + 1).toBe(2);
  });

  it("ServicesHome import test", async () => {
    const { ServicesHome } = await import("./ServicesHome");
    expect(ServicesHome).toBeDefined();
  });
});
