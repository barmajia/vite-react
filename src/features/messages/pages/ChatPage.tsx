import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { supabase } from "@/lib/supabase";
import { Message } from "@/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  File,
  Smile,
  Mic,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/chatConfig";

export const ChatPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, participants, loading, sendMessage } = useChat(
    conversationId || null,
    user?.id || "",
  );

  // Get other participant (for 1-on-1 chat)
  const otherParticipant = participants.find(
    (p) => p.user_id !== user?.id,
  )?.user;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!conversationId) {
      navigate("/messages");
      return;
    }
  }, [user, conversationId, navigate]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    try {
      setIsSending(true);
      await sendMessage(newMessage.trim(), "text");
      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(`/${conversationId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(data.path);

      // Send message with attachment
      await sendMessage(file.name, "file");

      if (file.type.startsWith("image/")) {
        await sendMessage(urlData.publicUrl, "image");
      }

      toast.success("File uploaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Upload error:", errorMessage);
      toast.error(`Failed to upload file: ${errorMessage}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    return message.read_at ? (
      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <Check className="w-3.5 h-3.5 text-muted-foreground" />
    );
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  if (!user || !conversationId) {
    return null;
  }

  const accountTypeConfig = otherParticipant
    ? ACCOUNT_TYPE_CONFIG[otherParticipant.account_type]
    : null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-background via-muted/10 to-background pt-16">
      {/* Header */}
      <Card className="rounded-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/messages")}
              className="hover:bg-muted/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <Avatar
              name={otherParticipant?.full_name}
              src={otherParticipant?.avatar_url}
              size="md"
              className={accountTypeConfig?.color || "bg-gray-500"}
            />

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base truncate">
                {otherParticipant?.full_name || "Unknown User"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {accountTypeConfig?.label || "User"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/80"
                title="Voice Call (Coming Soon)"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/80"
                title="Video Call (Coming Soon)"
              >
                <Video className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/80"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Send className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === user.id;
                  const prevMessage = messages[index - 1];
                  const showDate =
                    index === 0 ||
                    formatMessageDate(message.created_at) !==
                      formatMessageDate(prevMessage.created_at);
                  const showAvatar =
                    !isOwn &&
                    (index === messages.length - 1 ||
                      messages[index + 1]?.sender_id !== message.sender_id);

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <Badge
                            variant="secondary"
                            className="px-3 py-1 text-xs font-medium bg-muted/80"
                          >
                            {formatMessageDate(message.created_at)}
                          </Badge>
                        </div>
                      )}

                      <div
                        className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        {!isOwn && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar ? (
                              <Avatar
                                name={otherParticipant?.full_name}
                                src={otherParticipant?.avatar_url}
                                size="sm"
                                className={
                                  accountTypeConfig?.color || "bg-gray-500"
                                }
                              />
                            ) : null}
                          </div>
                        )}

                        <div
                          className={`group relative max-w-[75%] md:max-w-[65%] rounded-2xl p-3 shadow-sm transition-all hover:shadow-md ${
                            isOwn
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border rounded-bl-sm"
                          }`}
                        >
                          {message.message_type === "image" &&
                            message.attachment_url && (
                              <div className="mb-2 overflow-hidden rounded-lg">
                                <img
                                  src={message.attachment_url}
                                  alt="Attachment"
                                  className="w-full h-auto max-w-md object-cover hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                            )}

                          {message.message_type === "file" && (
                            <div className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-muted/50">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <File className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {message.attachment_name || "File"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Document
                                </p>
                              </div>
                            </div>
                          )}

                          {message.content &&
                            message.message_type !== "file" && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}

                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <span className="text-xs opacity-70">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isOwn && getMessageStatusIcon(message)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <Card className="rounded-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-muted/80"
                onClick={() => fileInputRef.current?.click()}
                title="Attach File"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-muted/80"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-muted/30 border-transparent focus:bg-background"
                disabled={isSending}
              />
              <div className="absolute right-2 bottom-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                  className="h-8 w-8 rounded-full shadow-md"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-muted/80"
              title="Voice Message (Coming Soon)"
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>

          {/* Emoji Picker (Simple) */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-4 mb-2 p-3 bg-card border border-border rounded-lg shadow-lg grid grid-cols-6 gap-2 animate-in slide-in-from-bottom-2">
              {[
                "😀",
                "😂",
                "🥰",
                "😎",
                "👍",
                "❤️",
                "🎉",
                "🔥",
                "👏",
                "🙏",
                "💯",
                "✨",
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-xl hover:bg-muted rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
