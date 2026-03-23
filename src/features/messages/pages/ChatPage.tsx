import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  User,
  File,
  Image as ImageIcon,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    try {
      setIsSending(true);
      await sendMessage(newMessage.trim(), "text");
      setNewMessage("");
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
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file: " + error.message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getMessageStatusIcon = (message: any) => {
    if (message.sender_id !== user?.id) return null;
    return message.read_at ? (
      <CheckCheck className="w-4 h-4 text-blue-500" />
    ) : (
      <Check className="w-4 h-4 text-muted-foreground" />
    );
  };

  if (!user || !conversationId) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-muted/20 pt-16">
      {/* Header */}
      <Card className="rounded-none border-b">
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/messages")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                otherParticipant
                  ? ACCOUNT_TYPE_CONFIG[otherParticipant.account_type]?.color
                  : "bg-gray-500"
              }`}
            >
              {otherParticipant?.avatar_url ? (
                <img
                  src={otherParticipant.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={20} />
              )}
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">
                {otherParticipant?.full_name || "Unknown User"}
              </h2>
              {otherParticipant && (
                <p className="text-sm text-muted-foreground">
                  {ACCOUNT_TYPE_CONFIG[otherParticipant.account_type]?.label}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                title="Voice Call (Coming Soon)"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Video Call (Coming Soon)"
              >
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user.id;
                const showDate =
                  index === 0 ||
                  new Date(message.created_at).toDateString() !==
                    new Date(messages[index - 1].created_at).toDateString();

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <Badge variant="outline">
                          {format(new Date(message.created_at), "MMMM d, yyyy")}
                        </Badge>
                      </div>
                    )}

                    <div
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.message_type === "image" &&
                          message.attachment_url && (
                            <img
                              src={message.attachment_url}
                              alt="Attachment"
                              className="rounded mb-2 max-w-full"
                            />
                          )}
                        {message.message_type === "file" && (
                          <div className="flex items-center gap-2 mb-2">
                            <File size={20} />
                            <span className="text-sm">
                              {message.attachment_name || "File"}
                            </span>
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                          <span>
                            {format(new Date(message.created_at), "h:mm a")}
                          </span>
                          {getMessageStatusIcon(message)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input */}
      <Card className="rounded-none border-t">
        <CardContent className="p-4">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              title="Send Image"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="min-h-[44px] resize-none"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
