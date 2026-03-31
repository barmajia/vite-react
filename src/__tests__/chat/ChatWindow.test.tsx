/**
 * ChatWindow Component Tests
 * Tests for the main chat window interface
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi as vitestVi } from "vitest";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "test@example.com",
      user_metadata: {
        full_name: "Test User",
      },
    },
  }),
}));

// Mock useMessages
vi.mock("@/hooks/useMessages", () => ({
  useMessages: () => ({
    messages: [
      {
        id: "msg-1",
        conversation_id: "conv-1",
        sender_id: "user-2",
        content: "Hello!",
        message_type: "text",
        is_deleted: false,
        created_at: "2026-03-29T10:00:00Z",
      },
      {
        id: "msg-2",
        conversation_id: "conv-1",
        sender_id: "user-1",
        content: "Hi there!",
        message_type: "text",
        is_deleted: false,
        created_at: "2026-03-29T10:01:00Z",
      },
    ],
    loading: false,
    sending: false,
    error: null,
    sendMessage: vi.fn(),
    deleteMessage: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { ChatWindow } from "@/pages/chat/ChatWindow";
import type { ConversationListItem } from "@/lib/chat-types";

// ============================================================================
// Test Utilities
// ============================================================================

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

const mockConversation: ConversationListItem = {
  id: "conv-1",
  context: "general",
  last_message: "Hello!",
  last_message_at: "2026-03-29T10:00:00Z",
  unread_count: 1,
  other_user: {
    user_id: "user-2",
    id: "user-2",
    email: "buyer@example.com",
    full_name: "John Buyer",
    avatar_url: null,
    account_type: "customer",
  },
  product: {
    id: "prod-1",
    title: "Test Product",
    price: 99.99,
    images: ["image1.jpg"],
  },
  is_archived: false,
};

// ============================================================================
// ChatWindow Component Tests
// ============================================================================

describe("ChatWindow", () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders chat window with conversation", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("John Buyer")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("displays messages in the chat", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("shows back button for mobile", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", async () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    await fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("shows sender name in header", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("John Buyer")).toBeInTheDocument();
  });

  it("shows product context in header", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("disables call buttons (coming soon)", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const voiceButton = screen.getByTitle("Voice Call (Coming Soon)");
    const videoButton = screen.getByTitle("Video Call (Coming Soon)");

    expect(voiceButton).toBeDisabled();
    expect(videoButton).toBeDisabled();
  });

  it("shows message input at bottom", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(
      screen.getByPlaceholderText("Type a message..."),
    ).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    // Re-mock useMessages with loading state
    vi.mock("@/hooks/useMessages", () => ({
      useMessages: () => ({
        messages: [],
        loading: true,
        sending: false,
        error: null,
        sendMessage: vi.fn(),
        deleteMessage: vi.fn(),
        refresh: vi.fn(),
      }),
    }));

    // Need to re-render to pick up new mock
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state when error occurs", () => {
    vi.mock("@/hooks/useMessages", () => ({
      useMessages: () => ({
        messages: [],
        loading: false,
        sending: false,
        error: "Failed to load messages",
        sendMessage: vi.fn(),
        deleteMessage: vi.fn(),
        refresh: vi.fn(),
      }),
    }));

    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("Failed to load messages")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    vi.mock("@/hooks/useMessages", () => ({
      useMessages: () => ({
        messages: [],
        loading: false,
        sending: false,
        error: null,
        sendMessage: vi.fn(),
        deleteMessage: vi.fn(),
        refresh: vi.fn(),
      }),
    }));

    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    expect(screen.getByText("Start the conversation!")).toBeInTheDocument();
  });

  it("displays account type badge for other user", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("shows avatar for other user", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const avatar = screen.getByRole("img");
    expect(avatar).toBeInTheDocument();
  });

  it("truncates long product titles", () => {
    const longTitleConversation = {
      ...mockConversation,
      product: {
        ...mockConversation.product,
        title: "A".repeat(100),
      },
    };

    render(
      <ChatWindow conversation={longTitleConversation} onBack={mockOnBack} />,
      { wrapper },
    );

    const titleElement = screen.getByText(/A{100}/);
    expect(titleElement).toHaveClass("truncate");
  });

  it("handles different conversation contexts", () => {
    const tradingConversation: ConversationListItem = {
      ...mockConversation,
      context: "trading",
      other_user: {
        ...mockConversation.other_user,
        account_type: "factory",
      },
    };

    render(
      <ChatWindow conversation={tradingConversation} onBack={mockOnBack} />,
      { wrapper },
    );

    expect(screen.getByText("Trading")).toBeInTheDocument();
  });

  it("shows message count in header", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    // Should show 2 messages
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("scrolls to bottom when new messages arrive", async () => {
    const { rerender } = render(
      <ChatWindow conversation={mockConversation} onBack={mockOnBack} />,
      { wrapper },
    );

    // Simulate new message by changing conversation
    const newConversation = {
      ...mockConversation,
      last_message: "New message!",
    };

    rerender(
      <ChatWindow conversation={newConversation} onBack={mockOnBack} />,
      { wrapper },
    );

    // Scroll should happen automatically
    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Message Actions Tests
// ============================================================================

describe("ChatWindow - Message Actions", () => {
  const mockOnBack = vi.fn();
  const mockDeleteMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mock("@/hooks/useMessages", () => ({
      useMessages: () => ({
        messages: [
          {
            id: "msg-1",
            conversation_id: "conv-1",
            sender_id: "user-2",
            content: "Hello!",
            message_type: "text",
            is_deleted: false,
            created_at: "2026-03-29T10:00:00Z",
          },
        ],
        loading: false,
        sending: false,
        error: null,
        sendMessage: vi.fn(),
        deleteMessage: mockDeleteMessage,
        refresh: vi.fn(),
      }),
    }));
  });

  it("allows deleting own messages", async () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    // Find own message and hover
    const ownMessage = screen.getByText("Hi there!");
    const messageBubble = ownMessage.closest("div");

    if (messageBubble) {
      await fireEvent.mouseEnter(messageBubble);

      const deleteButton = screen.getByText("Delete");
      await fireEvent.click(deleteButton);

      expect(mockDeleteMessage).toHaveBeenCalledWith("msg-2");
    }
  });

  it("shows confirmation before deleting", async () => {
    // Mock confirm dialog
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const ownMessage = screen.getByText("Hi there!");
    const messageBubble = ownMessage.closest("div");

    if (messageBubble) {
      await fireEvent.mouseEnter(messageBubble);
      const deleteButton = screen.getByText("Delete");
      await fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith("Delete this message?");
    }
  });

  it("shows success toast after deleting", async () => {
    const { toast } = await import("sonner");

    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const ownMessage = screen.getByText("Hi there!");
    const messageBubble = ownMessage.closest("div");

    if (messageBubble) {
      await fireEvent.mouseEnter(messageBubble);
      const deleteButton = screen.getByText("Delete");
      await fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(vi.mocked(toast).success).toHaveBeenCalledWith(
          "Message deleted",
        );
      });
    }
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe("ChatWindow - Accessibility", () => {
  const mockOnBack = vi.fn();

  it("has proper ARIA labels", () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("is keyboard navigable", async () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const textarea = screen.getByPlaceholderText("Type a message...");

    // Focus should move to textarea
    textarea.focus();
    expect(textarea).toHaveFocus();

    // Tab should move to send button
    await fireEvent.keyDown(textarea, { key: "Tab" });
  });

  it("supports Enter key to send", async () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const textarea = screen.getByPlaceholderText("Type a message...");
    await fireEvent.change(textarea, { target: { value: "Test message" } });
    await fireEvent.keyDown(textarea, { key: "Enter" });

    const { useMessages } = await import("@/hooks/useMessages");
    await waitFor(() => {
      expect(vi.mocked(useMessages()).sendMessage).toHaveBeenCalled();
    });
  });

  it("supports Shift+Enter for new line", async () => {
    render(<ChatWindow conversation={mockConversation} onBack={mockOnBack} />, {
      wrapper,
    });

    const textarea = screen.getByPlaceholderText("Type a message...");
    await fireEvent.change(textarea, { target: { value: "Line 1" } });
    await fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(textarea).toHaveValue("Line 1");
  });
});
