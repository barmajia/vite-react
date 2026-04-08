/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />
/**
 * Test Utilities
 * Helper functions for testing React components
 */

import React, { ReactElement } from "react";
import {
  render,
  RenderOptions,
  RenderResult,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

// Import your providers
import { AuthProvider } from "@/hooks/useAuth";

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Mock auth context values
export interface MockAuthOptions {
  user?: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  session?: {
    access_token: string;
    refresh_token: string;
    user?: {
      id: string;
      email: string;
    };
  } | null;
  isLoading?: boolean;
}

export function createMockAuth(options: MockAuthOptions = {}) {
  const { user = null, session = null, isLoading = false } = options;

  return {
    user,
    session,
    loading: isLoading,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    checkProviderProfile: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  authOptions?: MockAuthOptions;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

// All the providers
function AllProviders({
  children,
  authOptions,
  queryClient,
  initialEntries,
}: {
  children: React.ReactNode;
  authOptions?: MockAuthOptions;
  queryClient?: QueryClient;
  initialEntries?: string[];
}) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render function
export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {},
): RenderResult {
  const { authOptions, queryClient, initialEntries, ...renderOptions } =
    options;

  return render(ui, {
    wrapper: (props) => (
      <AllProviders
        authOptions={authOptions}
        queryClient={queryClient}
        initialEntries={initialEntries}
        {...props}
      />
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Custom test utilities
export const createMockFile = (
  name: string = "test.png",
  type: string = "image/png",
  _size: number = 1024,
): File => {
  return new File(["test content"], name, { type });
};

export const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

export const waitForLoadingToFinish = async () => {
  await waitFor(
    () => {
      const loadingElements = screen.queryAllByText(/loading/i);
      expect(loadingElements.length).toBe(0);
    },
    { timeout: 5000 },
  );
};

export const waitForElementToBeRemoved = async (
  callback: () => HTMLElement | null,
) => {
  await vi.waitFor(
    () => {
      expect(callback()).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
};

export const selectOption = async (
  select: HTMLElement,
  option: string | RegExp,
) => {
  fireEvent.mouseDown(select);
  const optionElement = screen.getByText(option);
  fireEvent.click(optionElement);
};

export const fillInput = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } });
};

export const fillForm = (form: HTMLElement, values: Record<string, string>) => {
  Object.entries(values).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      fillInput(input, value);
    }
  });
};

export const submitForm = (form: HTMLElement) => {
  fireEvent.submit(form);
};

// Mock data generators
export const generateMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  full_name: "Test User",
  phone: "+1234567890",
  avatar_url: "https://example.com/avatar.png",
  account_type: "user" as const,
  ...overrides,
});

export const generateMockProduct = (overrides = {}) => ({
  id: "test-product-id",
  asin: "TEST123",
  title: "Test Product",
  description: "Test description",
  price: 99.99,
  quantity: 10,
  images: ["https://example.com/product.png"],
  category: "Electronics",
  seller_id: "test-seller-id",
  ...overrides,
});

export const generateMockOrder = (overrides = {}) => ({
  id: "test-order-id",
  user_id: "test-user-id",
  status: "pending" as const,
  total: 99.99,
  items: [],
  created_at: new Date().toISOString(),
  ...overrides,
});

// Assertion helpers
export const expectElement = (selector: string) => {
  return expect(document.querySelector(selector));
};

export const expectText = (text: string | RegExp) => {
  return expect(screen.getByText(text));
};

export const expectLabel = (label: string) => {
  return expect(screen.getByLabelText(label));
};

export const expectPlaceholder = (placeholder: string) => {
  return expect(screen.getByPlaceholderText(placeholder));
};

export const expectTestId = (testId: string) => {
  return expect(screen.getByTestId(testId));
};

// Console mock helpers
export const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  info: vi.spyOn(console, "info").mockImplementation(() => {}),
};

export const restoreConsole = () => {
  mockConsole.log.mockRestore();
  mockConsole.error.mockRestore();
  mockConsole.warn.mockRestore();
  mockConsole.info.mockRestore();
};

// Timer mocks
export const mockTimers = {
  install: () => vi.useFakeTimers(),
  runAll: () => vi.runAllTimers(),
  // runToLast: () => vi.runToLast(),
  advanceTo: (time: number) => vi.advanceTimersByTime(time),
  restore: () => vi.useRealTimers(),
};

export default {
  customRender,
  createTestQueryClient,
  createMockAuth,
  createMockFile,
  generateMockUser,
  generateMockProduct,
  generateMockOrder,
  waitForLoadingToFinish,
  fillInput,
  fillForm,
  submitForm,
  selectOption,
  mockConsole,
  restoreConsole,
  mockTimers,
};
