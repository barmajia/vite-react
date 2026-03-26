// ConversationInfo Component for Aurora Chat System
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  Block,
  MessageSquareOff,
} from "lucide-react";
import type { ConversationListItem } from "@/lib/chat-types";
import { formatMessageTime, getContextBadgeColor, getContextLabel } from "@/lib/chat-utils";

interface ConversationInfoProps {
  conversation: ConversationListItem;
  onClose: () => void;
}

export function ConversationInfo({
  conversation,
  onClose,
}: ConversationInfoProps) {
  const getOtherUserName = () => {
    return conversation.other_user?.full_name || "User";
  };

  const getOtherUserAccountType = () => {
    return conversation.other_user?.account_type || "user";
  };

  const handleBlockUser = () => {
    // TODO: Implement block user functionality
    console.log("Block user:", conversation.other_user?.user_id);
  };

  const handleReportConversation = () => {
    // TODO: Implement report conversation functionality
    console.log("Report conversation:", conversation.id);
  };

  const handleArchiveConversation = () => {
    // TODO: Implement archive conversation functionality
    console.log("Archive conversation:", conversation.id);
  };

  return (
    <div className="w-80 border-l bg-card h-full overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
        <h2 className="font-semibold">Conversation Info</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-6">
          {/* User Profile */}
          <div className="text-center">
            <Avatar
              name={getOtherUserName()}
              src={conversation.other_user?.avatar_url}
              size="xl"
              className="mx-auto mb-3"
            />
            <h3 className="font-semibold text-lg">{getOtherUserName()}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {getOtherUserAccountType().replace("_", " ")}
            </p>
          </div>

          {/* Context Badge */}
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={`text-sm ${getContextBadgeColor(conversation.context)}`}
            >
              {getContextLabel(conversation.context)}
            </Badge>
            {conversation.is_archived && (
              <Badge variant="outline" className="ml-2">
                Archived
              </Badge>
            )}
          </div>

          {/* Conversation Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Details
            </h4>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created:</span>
                <span className="text-muted-foreground">
                  {conversation.last_message_at
                    ? formatMessageTime(conversation.last_message_at)
                    : "N/A"}
                </span>
              </div>

              {conversation.last_message_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Last active:</span>
                  <span className="text-muted-foreground">
                    {formatMessageTime(conversation.last_message_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info (if applicable) */}
          {conversation.product && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Related Product
              </h4>
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-sm font-medium line-clamp-2">
                  {conversation.product.title}
                </p>
                {conversation.product.price && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversation.product.price.toFixed(2)} EGP
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    📦 Product
                  </Badge>
                  {conversation.product.status && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {conversation.product.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appointment Info (if applicable) */}
          {conversation.appointment && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Appointment
              </h4>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    {new Date(
                      conversation.appointment.scheduled_at
                    ).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs capitalize bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                >
                  {conversation.appointment.status}
                </Badge>
              </div>
            </div>
          )}

          {/* Listing Info (if applicable) */}
          {conversation.listing && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Service Listing
              </h4>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  {conversation.listing.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                  >
                    🛠️ Service
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">
              Actions
            </h4>

            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleArchiveConversation}
            >
              <MessageSquareOff className="h-4 w-4 mr-2" />
              Archive Conversation
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleBlockUser}
            >
              <Block className="h-4 w-4 mr-2" />
              Block User
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleReportConversation}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Conversation
            </Button>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium">Safety Tips</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li>• Never share personal information</li>
                  <li>• Keep conversations on Aurora</li>
                  <li>• Report suspicious behavior</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
