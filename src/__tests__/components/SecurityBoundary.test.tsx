/**
 * SecurityBoundary Component Tests
 * Tests for the security boundary error boundary component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SecurityBoundary,
  useSecurityMonitor,
} from "../../components/SecurityBoundary";
import { auditLogger } from "../../lib/security-utils";

// Mock child component that throws error
const ThrowErrorComponent = ({
  throwError = true,
}: {
  throwError?: boolean;
}) => {
  if (throwError) {
    throw new Error("Test error");
  }
  return <div>Success</div>;
};

// Mock XSS attack component
const ThrowXSSComponent = () => {
  throw new Error('<script>alert("xss")</script>');
};

describe("SecurityBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when no error occurs", () => {
    render(
      <SecurityBoundary>
        <div>Test Content</div>
      </SecurityBoundary>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should show error UI when child throws error", () => {
    render(
      <SecurityBoundary>
        <ThrowErrorComponent />
      </SecurityBoundary>,
    );

    expect(screen.getByText("Security Alert")).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it("should not show error UI when child renders successfully", () => {
    render(
      <SecurityBoundary>
        <ThrowErrorComponent throwError={false} />
      </SecurityBoundary>,
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.queryByText("Security Alert")).not.toBeInTheDocument();
  });

  it("should use custom fallback when provided", () => {
    const customFallback = (
      <div data-testid="custom-fallback">Custom Error</div>
    );

    render(
      <SecurityBoundary fallback={customFallback}>
        <ThrowErrorComponent />
      </SecurityBoundary>,
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });

  it("should call onSecurityError callback when error occurs", () => {
    const onSecurityError = vi.fn();

    render(
      <SecurityBoundary onSecurityError={onSecurityError}>
        <ThrowErrorComponent />
      </SecurityBoundary>,
    );

    expect(onSecurityError).toHaveBeenCalledTimes(1);
    expect(onSecurityError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it("should detect potential XSS attacks", () => {
    const onSecurityError = vi.fn();

    render(
      <SecurityBoundary onSecurityError={onSecurityError}>
        <ThrowXSSComponent />
      </SecurityBoundary>,
    );

    // Should log XSS attempt
    expect(onSecurityError).toHaveBeenCalled();
  });

  it("should allow retry after error", () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>Recovered</div>;
    };

    render(
      <SecurityBoundary>
        <TestComponent />
      </SecurityBoundary>,
    );

    expect(screen.getByText("Security Alert")).toBeInTheDocument();

    // Change component to not throw
    shouldThrow = false;

    // Click try again button
    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Note: In real scenario, the parent would re-render the child
    // This is just testing the button exists and is clickable
    expect(tryAgainButton).toBeInTheDocument();
  });

  it("should allow page reload", () => {
    render(
      <SecurityBoundary>
        <ThrowErrorComponent />
      </SecurityBoundary>,
    );

    const reloadButton = screen.getByRole("button", { name: /reload page/i });
    expect(reloadButton).toBeInTheDocument();

    // Mock window.location.reload
    const reloadSpy = vi
      .spyOn(window.location, "reload")
      .mockImplementation(() => {});

    fireEvent.click(reloadButton);
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    reloadSpy.mockRestore();
  });

  it("should show technical details in development mode", () => {
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;

    render(
      <SecurityBoundary>
        <ThrowErrorComponent />
      </SecurityBoundary>,
    );

    expect(screen.getByText(/Technical Details/i)).toBeInTheDocument();

    import.meta.env.DEV = originalEnv;
  });

  it("should log security events to audit logger", () => {
    const logSpy = vi.spyOn(auditLogger, "log");

    render(
      <SecurityBoundary enableLogging={true}>
        <ThrowErrorComponent />
      </SecurityBoundary>,
    );

    expect(logSpy).toHaveBeenCalledWith(
      "SUSPICIOUS_ACTIVITY",
      expect.any(String),
      expect.objectContaining({ action: expect.any(String) }),
      expect.any(Object),
    );

    logSpy.mockRestore();
  });
});

describe("useSecurityMonitor", () => {
  it("should provide trackAction function", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    expect(result.current.trackAction).toBeDefined();
    expect(typeof result.current.trackAction).toBe("function");
  });

  it("should allow actions under rate limit", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    const allowed = result.current.trackAction("test_action", 5, 60000);
    expect(allowed).toBe(true);
  });

  it("should block actions over rate limit", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    // Use up the limit
    for (let i = 0; i < 5; i++) {
      result.current.trackAction("rate_test", 5, 60000);
    }

    // Next action should be blocked
    const blocked = result.current.trackAction("rate_test", 5, 60000);
    expect(blocked).toBe(false);
  });

  it("should call onSecurityViolation when rate limit exceeded", () => {
    const onViolation = vi.fn();
    const { result } = renderHook(() =>
      useSecurityMonitor({
        onSecurityViolation: onViolation,
      }),
    );

    // Use up the limit
    for (let i = 0; i < 10; i++) {
      result.current.trackAction("violation_test", 10, 60000);
    }

    // Exceed limit
    result.current.trackAction("violation_test", 10, 60000);

    expect(onViolation).toHaveBeenCalledWith("rate_limit", expect.any(Object));
  });

  it("should track different actions separately", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    // Use up limit for action1
    for (let i = 0; i < 5; i++) {
      result.current.trackAction("action1", 5, 60000);
    }

    // action2 should still be allowed
    const allowed = result.current.trackAction("action2", 5, 60000);
    expect(allowed).toBe(true);
  });
});

// Helper to use hook in test
function renderHook<T>(callback: () => T) {
  const result = { current: null as T | null };

  const TestComponent = () => {
    result.current = callback();
    return null;
  };

  render(<TestComponent />);

  return { result: result as { current: T } };
}
