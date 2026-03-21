import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Archive,
  Trash2,
  Paperclip,
  File,
  Check,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnifiedMessagingService } from "../services/unified-messaging.service";
import type { UnifiedConversation, UnifiedMessage } from "../types/messaging";
import { ContextSpecificActions } from "./ContextSpecificActions";

interface UnifiedChatProps {
  conversationId?: string;
  context?: "product" | "service" | "healthcare" | "factory";
  contextId?: string;
}

export const UnifiedChat = ({
  conversationId: propConversationId,
  context,
  contextId,
}: UnifiedChatProps) => {
  const { conversationId: paramConversationId } = useParams<{
    conversationId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const conversationId = propConversationId || paramConversationId;

  const [conversation, setConversation] = useState<UnifiedConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadConversation(conversationId);
      loadMessages(conversationId);
      subscribeToConversation(conversationId);
    } else if (context && contextId && user) {
      initializeConversation(context, contextId);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId, context, contextId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async (id: string) => {
    try {
      const convs = await UnifiedMessagingService.getConversations({
        limit: 100,
      });
      const conv = convs.find((c: any) => c.id === id);
      if (conv) {
        setConversation(conv);
        await UnifiedMessagingService.markAsRead(id);
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const initializeConversation = async (ctx: string, ctxId: string) => {
    try {
      // TODO: Get participant ID from context (product seller, service provider, etc.)
      const participantId = "TODO";

      const params: any = {
        context: ctx as any,
        participantId,
      };

      if (ctx === "product") params.productId = ctxId;
      if (ctx === "service") params.serviceListingId = ctxId;
      if (ctx === "healthcare") params.healthcareAppointmentId = ctxId;
      if (ctx === "factory") params.factoryDealId = ctxId;

      const conv =
        await UnifiedMessagingService.getOrCreateConversation(params);
      if (conv) {
        setConversation(conv);
        navigate(`/messages/${conv.id}`);
      }
    } catch (error: any) {
      console.error("Error initializing conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await UnifiedMessagingService.getMessages(convId, {
        limit: 50,
      });
      setMessages(msgs);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToConversation = (convId: string) => {
    unsubscribeRef.current = UnifiedMessagingService.subscribeToConversation(
      convId,
      {
        onMessage: (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_id !== user?.id) {
            UnifiedMessagingService.markAsRead(convId);
          }
        },
      },
    );
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    if (!conversation || !user) return;

    setSending(true);
    try {
      let attachmentUrl = "";

      if (attachment) {
        // Upload attachment to Supabase Storage
        const fileExt = attachment.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(fileName, attachment);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("message-attachments")
          .getPublicUrl(fileName);

        attachmentUrl = urlData.publicUrl;
      }

      await UnifiedMessagingService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        messageType: attachment ? "file" : "text",
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachment?.name,
        attachmentSize: attachment?.size,
      });

      setNewMessage("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setAttachment(file);
    }
  };

  const handleArchiveConversation = async () => {
    if (!conversation) return;

    try {
      await UnifiedMessagingService.archiveConversation(conversation.id);
      setConversation((prev) => (prev ? { ...prev, is_archived: true } : null));
      toast.success("Conversation archived");
      setShowArchiveDialog(false);
    } catch (error: any) {
      console.error("Error archiving:", error);
      toast.error("Failed to archive conversation");
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversation) return;

    try {
      await UnifiedMessagingService.deleteConversation(conversation.id);
      toast.success("Conversation deleted");
      setShowDeleteDialog(false);
      navigate("/messages");
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const getContextBadge = () => {
    if (!conversation) return null;

    const contextInfo = {
      product: { label: "Product", icon: "🛍️", color: "bg-blue-500" },
      service: { label: "Service", icon: "🛠️", color: "bg-green-500" },
      healthcare: { label: "Healthcare", icon: "🏥", color: "bg-red-500" },
      factory: { label: "Factory", icon: "🏭", color: "bg-orange-500" },
      support: { label: "Support", icon: "💬", color: "bg-purple-500" },
      general: { label: "General", icon: "💭", color: "bg-gray-500" },
    };

    const info = contextInfo[conversation.context] || contextInfo.general;

    return (
      <Badge className={`${info.color} text-white`}>
        {info.icon} {info.label}
      </Badge>
    );
  };

  const getContextSpecificContent = () => {
    if (!conversation) return null;

    switch (conversation.context) {
      case "product":
        return (
          conversation.product && (
            <div className="text-sm text-muted-foreground">
              About:{" "}
              <span className="font-medium">{conversation.product.title}</span>
              {conversation.product.price &&
                ` - $${conversation.product.price}`}
            </div>
          )
        );
      case "service":
        return (
          conversation.service_listing && (
            <div className="text-sm text-muted-foreground">
              About:{" "}
              <span className="font-medium">
                {conversation.service_listing.title}
              </span>
              {conversation.service_listing.price &&
                ` - $${conversation.service_listing.price}`}
            </div>
          )
        );
      case "healthcare":
        return (
          conversation.appointment && (
            <div className="text-sm text-muted-foreground">
              Appointment:{" "}
              <span className="font-medium">
                {new Date(
                  conversation.appointment.scheduled_at,
                ).toLocaleDateString()}
              </span>
            </div>
          )
        );
      case "factory":
        return (
          conversation.deal && (
            <div className="text-sm text-muted-foreground">
              Deal:{" "}
              <span className="font-medium">{conversation.deal.title}</span>
            </div>
          )
        );
      default:
        return null;
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Conversation not found</h3>
          <p className="text-muted-foreground mt-2">
            This conversation doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/messages")} className="mt-4">
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Avatar
            name={conversation.other_user?.full_name || "User"}
            src={conversation.other_user?.avatar_url}
            alt={conversation.other_user?.full_name || ""}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold truncate">
                {conversation.other_user?.full_name || "User"}
              </h2>
              {getContextBadge()}
            </div>
            {getContextSpecificContent()}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Context-Specific Actions */}
      <ContextSpecificActions conversation={conversation} />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const showDate =
              index === 0 ||
              new Date(message.created_at).toDateString() !==
                new Date(messages[index - 1].created_at).toDateString();

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <Badge variant="outline" className="text-xs">
                      {formatMessageDate(message.created_at)}
                    </Badge>
                  </div>
                )}

                <div
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {/* Attachment */}
                    {message.attachment_url && (
                      <div className="mb-2">
                        {message.message_type === "image" ? (
                          <img
                            src={message.attachment_url}
                            alt="Attachment"
                            className="rounded-lg max-w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2 bg-background/10 rounded p-2">
                            <File className="h-4 w-4" />
                            <span className="text-sm truncate">
                              {message.attachment_name || "Attachment"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    {message.content && (
                      <p className="text-sm break-words">{message.content}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                      <span>{formatMessageTime(message.created_at)}</span>
                      {isOwn && (
                        <span>
                          {message.is_read ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Attachment preview */}
      {attachment && (
        <div className="border-t p-2 bg-muted">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4" />
            <span className="text-sm truncate flex-1">{attachment.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleAttachmentSelect}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <Button
            type="submit"
            size="icon"
            disabled={sending || (!newMessage.trim() && !attachment)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will hide the conversation from your inbox. You can access it
            later from archived conversations.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleArchiveConversation}>Archive</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-destructive">
            This will permanently delete the conversation and all messages. This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConversation}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
