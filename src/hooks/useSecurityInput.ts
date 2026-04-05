/**
 * useSecurityInput - Secure Input Validation Hook
 * Provides real-time security validation for user inputs
 */

import { useState, useCallback, useMemo } from "react";
import {
  detectXSS,
  detectSQLInjection,
  detectPathTraversal,
  sanitizeXSS,
  validateEmail,
  validatePassword,
} from "@/lib/security-utils";
import { SECURITY_CONSTANTS } from "@/lib/security-constants";

export interface SecurityValidationResult {
  isValid: boolean;
  hasThreat: boolean;
  threats: string[];
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
}

export interface UseSecurityInputOptions {
  type?: "text" | "email" | "password" | "url" | "phone" | "file";
  validateXSS?: boolean;
  validateSQLInjection?: boolean;
  validatePathTraversal?: boolean;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  pattern?: RegExp;
  sanitize?: boolean;
}

export function useSecurityInput(options: UseSecurityInputOptions = {}) {
  const {
    type = "text",
    validateXSS = true,
    validateSQLInjection = true,
    validatePathTraversal = false,
    maxLength,
    minLength,
    required = false,
    pattern,
    sanitize = true,
  } = options;

  const [value, setValue] = useState("");
  const [validation, setValidation] = useState<SecurityValidationResult>({
    isValid: true,
    hasThreat: false,
    threats: [],
    sanitizedValue: "",
    errors: [],
    warnings: [],
  });
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    (inputValue: string): SecurityValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const threats: string[] = [];

      let sanitizedValue = inputValue;
      let hasThreat = false;

      // Check for XSS
      if (validateXSS && detectXSS(inputValue)) {
        threats.push("Potential XSS attack detected");
        hasThreat = true;
        if (sanitize) {
          sanitizedValue = sanitizeXSS(inputValue);
        }
      }

      // Check for SQL Injection
      if (validateSQLInjection && detectSQLInjection(inputValue)) {
        threats.push("Potential SQL injection detected");
        hasThreat = true;
      }

      // Check for Path Traversal
      if (validatePathTraversal && detectPathTraversal(inputValue)) {
        threats.push("Potential path traversal attack detected");
        hasThreat = true;
      }

      // Required validation
      if (required && !inputValue.trim()) {
        errors.push("This field is required");
      }

      // Length validations
      if (inputValue && maxLength && inputValue.length > maxLength) {
        errors.push(`Maximum length is ${maxLength} characters`);
      }

      if (inputValue && minLength && inputValue.length < minLength) {
        errors.push(`Minimum length is ${minLength} characters`);
      }

      // Type-specific validations
      if (inputValue) {
        switch (type) {
          case "email": {
            if (!validateEmail(inputValue)) {
              errors.push("Invalid email address format");
            }
            break;
          }
          case "password": {
            const passwordValidation = validatePassword(inputValue);
            if (!passwordValidation.valid) {
              errors.push(...passwordValidation.errors);
            }
            break;
          }
          case "url": {
            try {
              new URL(inputValue);
            } catch {
              errors.push("Invalid URL format");
            }
            break;
          }
          case "phone": {
            const phoneRegex =
              /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
            if (!phoneRegex.test(inputValue.replace(/\s/g, ""))) {
              errors.push("Invalid phone number format");
            }
            break;
          }
        }

        // Pattern validation
        if (pattern && !pattern.test(inputValue)) {
          errors.push("Input does not match required pattern");
        }
      }

      // Security warnings (non-blocking)
      if (inputValue.length > 1000) {
        warnings.push("Unusually long input detected");
      }

      if (/[<>{}[\]\\]/.test(inputValue) && type === "text") {
        warnings.push("Special characters detected");
      }

      return {
        isValid: errors.length === 0 && !hasThreat,
        hasThreat,
        threats,
        sanitizedValue,
        errors,
        warnings,
      };
    },
    [
      type,
      validateXSS,
      validateSQLInjection,
      validatePathTraversal,
      maxLength,
      minLength,
      required,
      pattern,
      sanitize,
    ],
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      setValidation(validate(newValue));
    },
    [validate],
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const reset = useCallback(() => {
    setValue("");
    setValidation({
      isValid: true,
      hasThreat: false,
      threats: [],
      sanitizedValue: "",
      errors: [],
      warnings: [],
    });
    setTouched(false);
  }, []);

  const inputProps = useMemo(
    () => ({
      value,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        handleChange(e.target.value);
      },
      onBlur: handleBlur,
    }),
    [value, handleChange, handleBlur],
  );

  return {
    value: validation.sanitizedValue,
    rawValue: value,
    validation,
    touched,
    inputProps,
    setValue: handleChange,
    reset,
    validate: () => validate(value),
  };
}

/**
 * Hook for secure file input validation
 */
export function useSecureFileUpload(
  options: {
    maxFileSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {},
) {
  const {
    maxFileSize = SECURITY_CONSTANTS.FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
    allowedTypes = [
      ...SECURITY_CONSTANTS.FILE_UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
      ...SECURITY_CONSTANTS.FILE_UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES,
    ],
    maxFiles = SECURITY_CONSTANTS.FILE_UPLOAD_CONFIG.MAX_FILES_PER_UPLOAD,
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });
  const [uploading, setUploading] = useState(false);

  const validateFiles = useCallback(
    (fileList: FileList | File[]) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const validFiles: File[] = [];

      const filesArray = Array.from(fileList);

      // Check file count
      if (filesArray.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return { isValid: false, errors, warnings, files: [] };
      }

      filesArray.forEach((file) => {
        // Check file size
        if (file.size > maxFileSize) {
          errors.push(
            `File "${file.name}" exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`,
          );
          return;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          errors.push(
            `File type "${file.type}" is not allowed for "${file.name}"`,
          );
          return;
        }

        // Check for suspicious file names
        if (/[<>{}[\]\\;:$]/.test(file.name)) {
          warnings.push(`Suspicious characters in filename: ${file.name}`);
        }

        // Check for double extensions
        const nameParts = file.name.split(".");
        if (nameParts.length > 2) {
          warnings.push(`Multiple extensions detected in: ${file.name}`);
        }

        validFiles.push(file);
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        files: validFiles,
      };
    },
    [maxFileSize, allowedTypes, maxFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const result = validateFiles(e.target.files);
        setValidation({
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings,
        });
        setFiles(result.files);
      }
    },
    [validateFiles],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setValidation({ isValid: true, errors: [], warnings: [] });
  }, []);

  return {
    files,
    validation,
    uploading,
    setUploading,
    handleFileChange,
    removeFile,
    clearFiles,
    validateFiles,
  };
}

export default useSecurityInput;
