/**
 * Simple test with mock - using imported vi
 */

// Using imported vi instead of global
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";

// vi.mock MUST be at the very top, before any other non-vitest imports
vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: "en" },
    }),
  };
});

import { render, screen } from "@testing-library/react";

describe("Test with mock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should work with mocks", () => {
    expect(1 + 1).toBe(2);
  });
});
