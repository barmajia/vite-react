/**
 * Chat Utilities Tests
 * Tests for chat-utils.ts helper functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getContextTable,
  getMessageTable,
  formatMessageTime,
  formatMessageDate,
  getMessageTypeFromFile,
  getFileIcon,
  formatFileSize,
  truncateMessage,
  getContextBadgeColor,
  getContextLabel,
  validateFile,
  canSendMessages,
  getConversationPartner,
} from "@/lib/chat-utils";
import { supabase } from "@/lib/supabase";

// Mock supabase storage
vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

// ============================================================================
// Table Name Mapping Tests
// ============================================================================

describe("getContextTable", () => {
  it("returns correct table for general context", () => {
    expect(getContextTable("general")).toBe("conversations");
  });

  it("returns correct table for trading context", () => {
    expect(getContextTable("trading")).toBe("trading_conversations");
  });

  it("returns correct table for health context", () => {
    expect(getContextTable("health")).toBe("health_conversations");
  });

  it("returns correct table for services context", () => {
    expect(getContextTable("services")).toBe("services_conversations");
  });

  it("returns conversations for product context", () => {
    expect(getContextTable("product")).toBe("conversations");
  });

  it("returns default table for unknown context", () => {
    expect(getContextTable("unknown" as any)).toBe("conversations");
  });
});

describe("getMessageTable", () => {
  it("returns correct table for general context", () => {
    expect(getMessageTable("general")).toBe("messages");
  });

  it("returns correct table for trading context", () => {
    expect(getMessageTable("trading")).toBe("trading_messages");
  });

  it("returns correct table for health context", () => {
    expect(getMessageTable("health")).toBe("health_messages");
  });

  it("returns correct table for services context", () => {
    expect(getMessageTable("services")).toBe("services_messages");
  });

  it("returns messages for product context", () => {
    expect(getMessageTable("product")).toBe("messages");
  });

  it("returns default table for unknown context", () => {
    expect(getMessageTable("unknown" as any)).toBe("messages");
  });
});

// ============================================================================
// Time Formatting Tests
// ============================================================================

describe("formatMessageTime", () => {
  beforeEach(() => {
    // Mock current date
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T12:00:00Z"));
  });

  it("shows time for today messages", () => {
    const today = new Date("2026-03-29T10:30:00Z").toISOString();
    const result = formatMessageTime(today);

    expect(result).toMatch(/\d{1,2}:\d{2}/);
    expect(result).toMatch(/(AM|PM)/);
  });

  it('shows "Yesterday" for yesterday messages', () => {
    const yesterday = new Date("2026-03-28T10:00:00Z").toISOString();
    const result = formatMessageTime(yesterday);

    expect(result).toBe("Yesterday");
  });

  it("shows day name for messages within a week", () => {
    const threeDaysAgo = new Date("2026-03-26T10:00:00Z").toISOString();
    const result = formatMessageTime(threeDaysAgo);

    expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
  });

  it("shows full date for older messages", () => {
    const lastWeek = new Date("2026-03-20T10:00:00Z").toISOString();
    const result = formatMessageTime(lastWeek);

    expect(result).toMatch(/\w+ \d{1,2}, \d{4}/);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe("formatMessageDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T12:00:00Z"));
  });

  it('shows "Today" for today messages', () => {
    const today = new Date("2026-03-29T10:00:00Z").toISOString();
    const result = formatMessageDate(today);

    expect(result).toBe("Today");
  });

  it('shows "Yesterday" for yesterday messages', () => {
    const yesterday = new Date("2026-03-28T10:00:00Z").toISOString();
    const result = formatMessageDate(yesterday);

    expect(result).toBe("Yesterday");
  });

  it("shows full date for older messages", () => {
    const lastWeek = new Date("2026-03-20T10:00:00Z").toISOString();
    const result = formatMessageDate(lastWeek);

    expect(result).toMatch(/\w+ \d{1,2}, \d{4}/);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

// ============================================================================
// File Handling Tests
// ============================================================================

describe("getMessageTypeFromFile", () => {
  it('returns "image" for image files', () => {
    const imageFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    expect(getMessageTypeFromFile(imageFile)).toBe("image");
  });

  it('returns "file" for video files', () => {
    const videoFile = new File(["test"], "test.mp4", { type: "video/mp4" });
    expect(getMessageTypeFromFile(videoFile)).toBe("file");
  });

  it('returns "file" for document files', () => {
    const docFile = new File(["test"], "test.pdf", { type: "application/pdf" });
    expect(getMessageTypeFromFile(docFile)).toBe("file");
  });

  it('returns "file" for other file types', () => {
    const otherFile = new File(["test"], "test.txt", { type: "text/plain" });
    expect(getMessageTypeFromFile(otherFile)).toBe("file");
  });
});

describe("getFileIcon", () => {
  it("returns image icon for image files", () => {
    expect(getFileIcon("image/jpeg")).toBe("🖼️");
  });

  it("returns video icon for video files", () => {
    expect(getFileIcon("video/mp4")).toBe("🎥");
  });

  it("returns audio icon for audio files", () => {
    expect(getFileIcon("audio/mp3")).toBe("🎵");
  });

  it("returns document icon for PDF files", () => {
    expect(getFileIcon("application/pdf")).toBe("📄");
  });

  it("returns document icon for Word files", () => {
    expect(getFileIcon("application/msword")).toBe("📝");
  });

  it("returns chart icon for Excel files", () => {
    expect(getFileIcon("application/vnd.ms-excel")).toBe("📊");
  });

  it("returns package icon for zip files", () => {
    expect(getFileIcon("application/zip")).toBe("📦");
  });

  it("returns paperclip icon for unknown types", () => {
    expect(getFileIcon("unknown/type")).toBe("📎");
  });
});

describe("formatFileSize", () => {
  it("formats bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(100)).toBe("100 Bytes");
  });

  it("formats KB correctly", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
  });

  it("formats MB correctly", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileSize(2097152)).toBe("2 MB");
  });

  it("formats GB correctly", () => {
    expect(formatFileSize(1073741824)).toBe("1 GB");
  });
});

describe("validateFile", () => {
  it("validates small image file", () => {
    const smallFile = new File(["test"], "test.jpg", {
      type: "image/jpeg",
    });

    const result = validateFile(smallFile);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects file larger than 10MB", () => {
    const largeFile = new File(["test"], "test.jpg", {
      type: "image/jpeg",
    });

    const result = validateFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("File size must be less than 10MB");
  });

  it("rejects disallowed file types", () => {
    const exeFile = new File(["test"], "test.exe", {
      type: "application/x-msdownload",
    });

    const result = validateFile(exeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("File type not allowed");
  });
});

// ============================================================================
// Message Formatting Tests
// ============================================================================

describe("truncateMessage", () => {
  it("returns full message if shorter than max length", () => {
    expect(truncateMessage("Hello")).toBe("Hello");
  });

  it("truncates message to default 50 characters", () => {
    const longMessage = "A".repeat(100);
    const result = truncateMessage(longMessage);

    expect(result.length).toBe(53); // 50 + '...'
    expect(result).toBe("A".repeat(50) + "...");
  });

  it("truncates message to specified max length", () => {
    const longMessage = "A".repeat(100);
    const result = truncateMessage(longMessage, 20);

    expect(result).toBe("A".repeat(20) + "...");
  });

  it("handles empty message", () => {
    expect(truncateMessage("")).toBe("");
  });

  it("handles null/undefined message", () => {
    expect(truncateMessage(null as any)).toBe("");
    expect(truncateMessage(undefined as any)).toBe("");
  });
});

// ============================================================================
// Context Badge Tests
// ============================================================================

describe("getContextBadgeColor", () => {
  it("returns blue color for general context", () => {
    const result = getContextBadgeColor("general");
    expect(result).toContain("blue");
  });

  it("returns purple color for trading context", () => {
    const result = getContextBadgeColor("trading");
    expect(result).toContain("purple");
  });

  it("returns green color for health context", () => {
    const result = getContextBadgeColor("health");
    expect(result).toContain("green");
  });

  it("returns orange color for services context", () => {
    const result = getContextBadgeColor("services");
    expect(result).toContain("orange");
  });

  it("returns indigo color for product context", () => {
    const result = getContextBadgeColor("product");
    expect(result).toContain("indigo");
  });

  it("returns default color for unknown context", () => {
    const result = getContextBadgeColor("unknown" as any);
    expect(result).toContain("blue");
  });
});

describe("getContextLabel", () => {
  it('returns "Chat" for general context', () => {
    expect(getContextLabel("general")).toBe("Chat");
  });

  it('returns "Trading" for trading context', () => {
    expect(getContextLabel("trading")).toBe("Trading");
  });

  it('returns "Health" for health context', () => {
    expect(getContextLabel("health")).toBe("Health");
  });

  it('returns "Service" for services context', () => {
    expect(getContextLabel("services")).toBe("Service");
  });

  it('returns "Product" for product context', () => {
    expect(getContextLabel("product")).toBe("Product");
  });

  it('returns "Chat" for unknown context', () => {
    expect(getContextLabel("unknown" as any)).toBe("Chat");
  });
});

// ============================================================================
// Permission Tests
// ============================================================================

describe("canSendMessages", () => {
  it("returns false for archived conversations", () => {
    const result = canSendMessages("general", "user-1", {
      is_archived: true,
    });

    expect(result).toBe(false);
  });

  it("returns true for active general conversations", () => {
    const result = canSendMessages("general", "user-1", {
      is_archived: false,
    });

    expect(result).toBe(true);
  });

  it("returns true for participants in health conversations", () => {
    const result = canSendMessages("health", "doctor-1", {
      is_archived: false,
      doctor_id: "doctor-1",
      status: "scheduled",
    });

    expect(result).toBe(true);
  });

  it("returns true for participants in services conversations", () => {
    const result = canSendMessages("services", "provider-1", {
      is_archived: false,
      provider_id: "provider-1",
    });

    expect(result).toBe(true);
  });

  it("returns true for participants in trading conversations", () => {
    const result = canSendMessages("trading", "initiator-1", {
      is_archived: false,
      initiator_id: "initiator-1",
    });

    expect(result).toBe(true);
  });
});

describe("getConversationPartner", () => {
  it("returns correct partner for trading conversations", () => {
    const conversation = {
      context: "trading",
      initiator_id: "user-1",
      receiver_id: "user-2",
      initiator_role: "seller",
      receiver_role: "factory",
    };

    const result = getConversationPartner(conversation, "user-1");

    expect(result.id).toBe("user-2");
    expect(result.role).toBe("factory");
  });

  it("returns correct partner for services conversations", () => {
    const conversation = {
      context: "services",
      provider_id: "provider-1",
      client_id: "client-1",
    };

    const result = getConversationPartner(conversation, "provider-1");

    expect(result.id).toBe("client-1");
    expect(result.role).toBe("client");
  });

  it("returns correct partner for health conversations", () => {
    const conversation = {
      context: "health",
      doctor_id: "doctor-1",
      patient_id: "patient-1",
    };

    const result = getConversationPartner(conversation, "doctor-1");

    expect(result.id).toBe("patient-1");
    expect(result.role).toBe("patient");
  });

  it("returns partner from participants for general conversations", () => {
    const conversation = {
      context: "general",
      participants: [
        { user_id: "user-1", role: "seller" },
        { user_id: "user-2", role: "customer" },
      ],
    };

    const result = getConversationPartner(conversation, "user-1");

    expect(result.id).toBe("user-2");
    expect(result.role).toBe("customer");
  });
});
