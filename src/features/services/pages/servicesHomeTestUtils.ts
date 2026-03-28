/**
 * Test utilities for ServicesHome tests
 */
import { vi } from "vitest";

// Mock implementations
export const mockUseTranslation = vi.fn().mockReturnValue({
  t: (key: string) => key,
  i18n: { language: "en", exists: () => false },
});

export const mockUseAuth = vi.fn().mockReturnValue({
  user: null,
  loading: false,
});

export const mockUseServiceCategories = vi.fn().mockReturnValue({
  data: [],
  isLoading: false,
  error: null,
});

export const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

// Helper to update mock return values
export function setAuthMock(user: any, loading = false) {
  mockUseAuth.mockReturnValue({ user, loading });
}

export function setCategoriesMock(data: any[], isLoading = false, error: any = null) {
  mockUseServiceCategories.mockReturnValue({ data, isLoading, error });
}
