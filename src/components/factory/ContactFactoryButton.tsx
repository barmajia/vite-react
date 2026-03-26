import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Factory } from "lucide-react";
import { toast } from "sonner";

interface ContactFactoryButtonProps {
  factoryUserId: string;
  productId?: string;
  productTitle?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const ContactFactoryButton = ({
  factoryUserId,
  productId,
  productTitle,
  variant = "default",
  size = "default",
  className = "",
}: ContactFactoryButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleContactFactory = async () => {
    if (!user) {
      toast.error("Please log in to contact factories");
      navigate("/login");
      return;
    }

    setIsLoading(true);

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("factory_id", factoryUserId)
        .eq("product_id", productId || null)
        .single();

      if (existingConv) {
        // Navigate to existing conversation
        navigate(`/messages/${existingConv.id}`);
        return;
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          factory_id: factoryUserId,
          product_id: productId || null,
          conversation_type: productId ? "product_inquiry" : "general",
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [
        {
          conversation_id: conversation.id,
          user_id: user.id,
          role: "seller" as const,
        },
        {
          conversation_id: conversation.id,
          user_id: factoryUserId,
          role: "factory" as const,
        },
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (partError) throw partError;

      // Send initial message
      const initialMessage = productTitle
        ? `Hi! I'm interested in "${productTitle}". Can we discuss pricing and availability?`
        : "Hello! I'd like to inquire about your products.";

      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: initialMessage,
        message_type: "text",
      });

      if (msgError) throw msgError;

      toast.success("Conversation started!");
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error contacting factory:", errorMessage);
      toast.error(errorMessage || "Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleContactFactory}
      disabled={isLoading}
    >
      <Factory className="h-4 w-4 mr-2" />
      {isLoading ? "Starting..." : "🏭 Contact Factory"}
    </Button>
  );
};
