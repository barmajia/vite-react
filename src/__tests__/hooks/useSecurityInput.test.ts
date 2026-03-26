/**
 * useSecurityInput Hook Tests
 * Tests for the secure input validation hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSecurityInput,
  useSecureFileUpload,
} from "../../hooks/useSecurityInput";

describe("useSecurityInput", () => {
  it("should initialize with empty value", () => {
    const { result } = renderHook(() => useSecurityInput());

    expect(result.current.value).toBe("");
    expect(result.current.validation.isValid).toBe(true);
    expect(result.current.validation.hasThreat).toBe(false);
  });

  it("should update value on change", () => {
    const { result } = renderHook(() => useSecurityInput());

    act(() => {
      result.current.inputProps.onChange({ target: { value: "test" } });
    });

    expect(result.current.value).toBe("test");
  });

  it("should detect XSS attacks", () => {
    const { result } = renderHook(() =>
      useSecurityInput({ validateXSS: true }),
    );

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "<script>alert(1)</script>" },
      });
    });

    expect(result.current.validation.hasThreat).toBe(true);
    expect(result.current.validation.threats).toContainEqual(
      expect.stringContaining("XSS"),
    );
  });

  it("should detect SQL injection", () => {
    const { result } = renderHook(() =>
      useSecurityInput({ validateSQLInjection: true }),
    );

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "SELECT * FROM users WHERE id=1 OR 1=1--" },
      });
    });

    expect(result.current.validation.hasThreat).toBe(true);
    expect(result.current.validation.threats).toContainEqual(
      expect.stringContaining("SQL injection"),
    );
  });

  it("should sanitize XSS when enabled", () => {
    const { result } = renderHook(() =>
      useSecurityInput({
        validateXSS: true,
        sanitize: true,
      }),
    );

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "<script>alert(1)</script>Safe" },
      });
    });

    expect(result.current.validation.sanitizedValue).not.toContain("<script>");
  });

  it("should validate required fields", () => {
    const { result } = renderHook(() => useSecurityInput({ required: true }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "" } });
    });

    expect(result.current.validation.errors).toContainEqual(
      "This field is required",
    );
  });

  it("should validate max length", () => {
    const { result } = renderHook(() => useSecurityInput({ maxLength: 5 }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "123456" } });
    });

    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("Maximum length"),
    );
  });

  it("should validate min length", () => {
    const { result } = renderHook(() => useSecurityInput({ minLength: 5 }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "123" } });
    });

    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("Minimum length"),
    );
  });

  it("should validate email format", () => {
    const { result } = renderHook(() => useSecurityInput({ type: "email" }));

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "invalid-email" },
      });
    });

    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("Invalid email"),
    );
  });

  it("should validate valid email", () => {
    const { result } = renderHook(() => useSecurityInput({ type: "email" }));

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "test@example.com" },
      });
    });

    expect(result.current.validation.errors).toHaveLength(0);
  });

  it("should validate password strength", () => {
    const { result } = renderHook(() => useSecurityInput({ type: "password" }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "weak" } });
    });

    expect(result.current.validation.errors.length).toBeGreaterThan(0);
  });

  it("should validate URL format", () => {
    const { result } = renderHook(() => useSecurityInput({ type: "url" }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "not-a-url" } });
    });

    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("Invalid URL"),
    );
  });

  it("should validate phone format", () => {
    const { result } = renderHook(() => useSecurityInput({ type: "phone" }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "abc123" } });
    });

    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("Invalid phone"),
    );
  });

  it("should validate pattern", () => {
    const { result } = renderHook(() =>
      useSecurityInput({
        pattern: /^[A-Z]+$/,
      }),
    );

    act(() => {
      result.current.inputProps.onChange({ target: { value: "abc123" } });
    });

    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("pattern"),
    );
  });

  it("should set touched on blur", () => {
    const { result } = renderHook(() => useSecurityInput());

    expect(result.current.touched).toBe(false);

    act(() => {
      result.current.inputProps.onBlur();
    });

    expect(result.current.touched).toBe(true);
  });

  it("should reset to initial state", () => {
    const { result } = renderHook(() => useSecurityInput());

    act(() => {
      result.current.inputProps.onChange({ target: { value: "test" } });
      result.current.inputProps.onBlur();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe("");
    expect(result.current.touched).toBe(false);
  });

  it("should warn on long input", () => {
    const { result } = renderHook(() => useSecurityInput());

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "a".repeat(1001) },
      });
    });

    expect(result.current.validation.warnings).toContainEqual(
      expect.stringContaining("long input"),
    );
  });

  it("should warn on special characters", () => {
    const { result } = renderHook(() => useSecurityInput({ type: "text" }));

    act(() => {
      result.current.inputProps.onChange({ target: { value: "test<>{}" } });
    });

    expect(result.current.validation.warnings).toContainEqual(
      expect.stringContaining("Special characters"),
    );
  });
});

describe("useSecureFileUpload", () => {
  const createMockFile = (name: string, type: string, size: number) => {
    return new File(["test content"], name, { type, size });
  };

  it("should initialize with empty files", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    expect(result.current.files).toHaveLength(0);
    expect(result.current.validation.isValid).toBe(true);
  });

  it("should accept valid files", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    const validFile = createMockFile("test.png", "image/png", 1024);
    const mockEvent = {
      target: { files: [validFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.validation.isValid).toBe(true);
  });

  it("should reject files exceeding size limit", () => {
    const { result } = renderHook(() =>
      useSecureFileUpload({
        maxFileSize: 1024, // 1KB
      }),
    );

    const largeFile = createMockFile("large.png", "image/png", 2048); // 2KB
    const mockEvent = {
      target: { files: [largeFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.validation.isValid).toBe(false);
    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("exceeds maximum size"),
    );
  });

  it("should reject invalid file types", () => {
    const { result } = renderHook(() =>
      useSecureFileUpload({
        allowedTypes: ["image/png"],
      }),
    );

    const invalidFile = createMockFile(
      "script.exe",
      "application/x-executable",
      1024,
    );
    const mockEvent = {
      target: { files: [invalidFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.validation.isValid).toBe(false);
    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("not allowed"),
    );
  });

  it("should reject too many files", () => {
    const { result } = renderHook(() =>
      useSecureFileUpload({
        maxFiles: 2,
      }),
    );

    const files = [
      createMockFile("file1.png", "image/png", 1024),
      createMockFile("file2.png", "image/png", 1024),
      createMockFile("file3.png", "image/png", 1024),
    ];
    const mockEvent = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.validation.isValid).toBe(false);
    expect(result.current.validation.errors).toContainEqual(
      expect.stringContaining("Maximum"),
    );
  });

  it("should warn on suspicious filenames", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    const suspiciousFile = createMockFile("file<>.png", "image/png", 1024);
    const mockEvent = {
      target: { files: [suspiciousFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.validation.warnings).toContainEqual(
      expect.stringContaining("Suspicious characters"),
    );
  });

  it("should warn on double extensions", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    const doubleExtFile = createMockFile(
      "file.tar.gz",
      "application/x-gzip",
      1024,
    );
    const mockEvent = {
      target: { files: [doubleExtFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.validation.warnings).toContainEqual(
      expect.stringContaining("Multiple extensions"),
    );
  });

  it("should remove files", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    const file1 = createMockFile("file1.png", "image/png", 1024);
    const file2 = createMockFile("file2.png", "image/png", 1024);
    const mockEvent = {
      target: { files: [file1, file2] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.files).toHaveLength(2);

    act(() => {
      result.current.removeFile(0);
    });

    expect(result.current.files).toHaveLength(1);
  });

  it("should clear all files", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    const file = createMockFile("file.png", "image/png", 1024);
    const mockEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    act(() => {
      result.current.clearFiles();
    });

    expect(result.current.files).toHaveLength(0);
  });

  it("should track uploading state", () => {
    const { result } = renderHook(() => useSecureFileUpload());

    expect(result.current.uploading).toBe(false);

    act(() => {
      result.current.setUploading(true);
    });

    expect(result.current.uploading).toBe(true);
  });
});
