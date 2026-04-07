import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  getHealthConversation,
  createHealthConversation,
  getHealthMessages,
  sendHealthMessage,
} from "../api/supabaseHealth";
import type { HealthMessage } from "../types";
import { toast } from "sonner";

const ConsultationRoom: React.FC = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState<HealthMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUser(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const initChat = async () => {
      if (!id) return;
      try {
        let conv = await getHealthConversation(id);
        if (!conv) conv = await createHealthConversation(id);
        setConversationId(conv.id);
        const msgs = await getHealthMessages(conv.id);
        setMessages(msgs);
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, [id]);

  const send = async () => {
    if (!conversationId || !input.trim() || !currentUser) return;
    try {
      setSending(true);
      await sendHealthMessage(conversationId, currentUser, input.trim());
      const updated = await getHealthMessages(conversationId);
      setMessages(updated);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading consultation...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden h-[600px] flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4">
          <h2 className="text-xl font-bold">💬 Consultation Room</h2>
          <p className="text-sm text-violet-100">
            Secure messaging with your healthcare provider
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_id === currentUser;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${isOwnMessage ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${isOwnMessage ? "text-violet-100" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 dark:text-white"
              placeholder="Type your message..."
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRoom;
