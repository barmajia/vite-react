/**
 * Security Boundary Component
 * Wraps components with security monitoring and error handling
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { auditLogger } from "@/lib/security-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Shield } from "lucide-react";

interface SecurityBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onSecurityError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableLogging?: boolean;
  className?: string;
}

interface SecurityBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class SecurityBoundary extends Component<
  SecurityBoundaryProps,
  SecurityBoundaryState
> {
  constructor(props: SecurityBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<SecurityBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo, errorCount: this.state.errorCount + 1 });

    // Log security-relevant errors
    if (this.props.enableLogging !== false) {
      auditLogger.log(
        "SUSPICIOUS_ACTIVITY",
        "high",
        {
          action: "Component error boundary triggered",
          timestamp: new Date(),
        },
        {
          error: error.message,
          componentStack: errorInfo.componentStack,
          errorCount: this.state.errorCount + 1,
        },
      );

      // Check for potential attack patterns
      if (this.isPotentialAttack(error, errorInfo)) {
        auditLogger.log(
          "XSS_ATTEMPT",
          "critical",
          {
            action: "Potential XSS or injection attack detected",
            timestamp: new Date(),
          },
          {
            error: error.message,
            componentStack: errorInfo.componentStack,
          },
        );
      }
    }

    // Call custom error handler
    this.props.onSecurityError?.(error, errorInfo);
  }

  private isPotentialAttack(error: Error, errorInfo: ErrorInfo): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror/i,
      /onload/i,
      /eval\(/i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i,
    ];

    const errorString = `${error.message} ${errorInfo.componentStack}`;
    return suspiciousPatterns.some((pattern) => pattern.test(errorString));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="my-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-800 dark:text-red-200">
                Security Alert
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                We detected an unexpected error that may indicate a security
                issue. For your protection, this component has been disabled.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-600 dark:text-red-400 mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="bg-red-100 dark:bg-red-900/50 p-3 rounded overflow-auto max-h-64">
                    <code>
                      {this.state.error.toString()}
                      {"\n\n"}
                      {this.state.errorInfo?.componentStack}
                    </code>
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Security Monitoring Hook
 * Monitors for suspicious activity and enforces security policies
 */
export function useSecurityMonitor(
  options: {
    enableXSSProtection?: boolean;
    enableClickjackingProtection?: boolean;
    enableRateLimiting?: boolean;
    onSecurityViolation?: (type: string, details: unknown) => void;
  } = {},
) {
  const {
    enableXSSProtection = true,
    enableClickjackingProtection = true,
    enableRateLimiting = true,
    onSecurityViolation,
  } = options;

  // Monitor for XSS attempts
  React.useEffect(() => {
    if (!enableXSSProtection) return;

    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes("script") ||
        event.message?.includes("javascript")
      ) {
        auditLogger.log(
          "XSS_ATTEMPT",
          "critical",
          {
            action: "XSS error detected",
            timestamp: new Date(),
          },
          {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        );
        onSecurityViolation?.("xss", { message: event.message });
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, [enableXSSProtection, onSecurityViolation]);

  // Protect against clickjacking
  React.useEffect(() => {
    if (!enableClickjackingProtection) return;

    const preventClickjacking = () => {
      if (window.self !== window.top) {
        auditLogger.log(
          "SUSPICIOUS_ACTIVITY",
          "high",
          {
            action: "Clickjacking attempt detected",
            timestamp: new Date(),
          },
          {
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          },
        );
        onSecurityViolation?.("clickjacking", { referrer: document.referrer });
        // In production, you might want to redirect or block
        // window.location.href = '/security-violation';
      }
    };

    preventClickjacking();
  }, [enableClickjackingProtection, onSecurityViolation]);

  // Monitor for rapid actions (potential bot activity)
  const actionTracker = React.useRef<Map<string, number[]>>(new Map());

  const trackAction = React.useCallback(
    (actionName: string, maxActions: number = 10, windowMs: number = 60000) => {
      const now = Date.now();
      const actions = actionTracker.current.get(actionName) || [];

      // Remove old actions outside the window
      const recentActions = actions.filter((time) => now - time < windowMs);

      if (recentActions.length >= maxActions) {
        auditLogger.log(
          "RATE_LIMIT_EXCEEDED",
          "medium",
          {
            action: `Rate limit exceeded for ${actionName}`,
            timestamp: new Date(),
          },
          {
            actionName,
            actionCount: recentActions.length,
            maxAllowed: maxActions,
            windowMs,
          },
        );
        onSecurityViolation?.("rate_limit", {
          actionName,
          count: recentActions.length,
        });
        return false;
      }

      recentActions.push(now);
      actionTracker.current.set(actionName, recentActions);
      return true;
    },
    [onSecurityViolation],
  );

  return {
    trackAction,
  };
}

export default SecurityBoundary;
