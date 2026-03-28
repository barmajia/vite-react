/**
 * ServicesHome Component Tests
 * Tests for the Services Home page component
 *
 * IMPORTANT: Using vitest globals - do NOT import test/describe/expect
 * Only import vi for mocking utilities
 */

import { vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.("supabase") || args[0]?.includes?.("channel")) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock modules BEFORE importing the component
vi.mock("@/components/layout/ServicesHeader", () => ({
  ServicesHeader: vi.fn(() => (
    <header data-testid="services-header">Header</header>
  )),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => key,
    i18n: { language: "en", exists: () => false },
  })),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
  })),
}));

vi.mock("@/lib/supabase", () => {
  // Create fresh mocks each time to avoid reset issues between tests
  const createMockChannel = () => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  });

  // Create a mock query builder that chains all methods
  const createMockQuery = () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return query;
  };

  return {
    supabase: {
      from: vi.fn().mockImplementation(() => createMockQuery()),
      channel: vi.fn().mockImplementation(() => createMockChannel()),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("@/features/services/hooks/useServiceCategories", () => ({
  useServiceCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Import after mocks
import { ServicesHome } from "@/features/services/pages/ServicesHome";
import { useAuth } from "@/hooks/useAuth";
import { useServiceCategories } from "@/features/services/hooks/useServiceCategories";

// Test helpers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderServicesHome(queryClient) {
  const client = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <ServicesHome />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe("ServicesHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null, loading: false });
    useServiceCategories.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  // Note: Not using restoreAllMocks here as it would break module-level mocks

  describe("Initial Rendering", () => {
    it("should render the main container", () => {
      renderServicesHome();
      // Component uses sections with region role instead of main
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("should display header", () => {
      renderServicesHome();
      expect(screen.getByTestId("services-header")).toBeInTheDocument();
    });
  });

  describe("Hero Section", () => {
    it("should render hero section with search functionality", () => {
      renderServicesHome();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("should render CTA button for non-authenticated user", () => {
      useAuth.mockReturnValue({ user: null, loading: false });
      renderServicesHome();
      expect(screen.getByText(/become a provider/i)).toBeInTheDocument();
    });

    it("should render CTA button for authenticated user", () => {
      useAuth.mockReturnValue({
        user: { id: "1", email: "test@test.com" },
        loading: false,
      });
      renderServicesHome();
      // There are multiple buttons with "Start Selling" text, use getAllBy
      expect(screen.getAllByText(/start selling/i).length).toBeGreaterThan(0);
    });

    it("should allow typing in search input", () => {
      renderServicesHome();
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "web design" } });
      expect(searchInput).toHaveValue("web design");
    });
  });

  describe("Trust Indicators", () => {
    it("should render trust indicators section", () => {
      renderServicesHome();
      expect(screen.getByLabelText(/platform benefits/i)).toBeInTheDocument();
    });

    it("should display Secure Payments indicator", () => {
      renderServicesHome();
      expect(screen.getByText(/secure payments/i)).toBeInTheDocument();
    });
  });

  describe("Categories", () => {
    const mockCategories = [
      {
        id: "1",
        name: "Technology",
        slug: "technology",
        description: "Tech services",
        icon_url: null,
        is_active: true,
        sort_order: 1,
        subcategories: [],
      },
    ];

    it("should render categories section", () => {
      useServiceCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      });
      renderServicesHome();
      expect(
        screen.getByLabelText(/explore capabilities/i),
      ).toBeInTheDocument();
    });

    it("should handle empty categories gracefully", () => {
      useServiceCategories.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      renderServicesHome();
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      renderServicesHome();
      const searchInput = screen.getByPlaceholderText(/search/i);
      // Check for aria-label instead of type attribute
      expect(searchInput).toHaveAttribute("aria-label");
    });

    it("should have proper role for trust indicators list", () => {
      renderServicesHome();
      expect(screen.getByLabelText(/platform benefits/i)).toHaveAttribute(
        "role",
        "list",
      );
    });
  });
});
