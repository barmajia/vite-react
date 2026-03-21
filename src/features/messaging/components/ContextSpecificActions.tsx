import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UnifiedConversation } from "../types/messaging";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  Package,
  Stethoscope,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ContextSpecificActionsProps {
  conversation: UnifiedConversation;
}

export const ContextSpecificActions = ({
  conversation,
}: ContextSpecificActionsProps) => {
  const navigate = useNavigate();

  const renderProductActions = () => {
    if (!conversation.product) return null;

    return (
      <div className="border-b p-4 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">
                {conversation.product.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                ${conversation.product.price?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/product/${conversation.product_id}`)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Product
          </Button>
        </div>
      </div>
    );
  };

  const renderServiceActions = () => {
    if (!conversation.service_listing) return null;

    return (
      <div className="border-b p-4 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">
                {conversation.service_listing.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                ${conversation.service_listing.price?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/services/listing/${conversation.service_listing_id}`)
            }
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Service
          </Button>
        </div>

        {conversation.context === "service" && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                navigate(
                  `/services/listing/${conversation.service_listing_id}/book`,
                )
              }
            >
              <Calendar className="h-3 w-3 mr-1" />
              Book Now
            </Button>
            <Button variant="outline" size="sm">
              Request Quote
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderHealthcareActions = () => {
    if (!conversation.appointment) return null;

    const appointmentDate = new Date(conversation.appointment.scheduled_at);
    const isPast = appointmentDate < new Date();
    const status = conversation.appointment.status;

    return (
      <div className="border-b p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">Medical Consultation</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {appointmentDate.toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {appointmentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {status === "completed" && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {status === "scheduled" && (
                <Badge variant="default" className="bg-blue-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  Scheduled
                </Badge>
              )}
              {status === "cancelled" && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Cancelled
                </Badge>
              )}
              {isPast && status !== "completed" && status !== "cancelled" && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Past Appointment
                </Badge>
              )}
            </div>
          </div>

          {!isPast && status === "scheduled" && (
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                navigate(`/services/health/consult/${conversation.id}`)
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Start Consultation
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderFactoryActions = () => {
    if (!conversation.deal) return null;

    return (
      <div className="border-b p-4 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{conversation.deal.title}</h4>
              <p className="text-sm text-muted-foreground">
                Status: {conversation.deal.status}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/factory/deals/${conversation.factory_deal_id}`)
            }
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Deal
          </Button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="default" size="sm">
            Send Proposal
          </Button>
          <Button variant="outline" size="sm">
            View History
          </Button>
        </div>
      </div>
    );
  };

  // Render based on context
  switch (conversation.context) {
    case "product":
      return renderProductActions();
    case "service":
      return renderServiceActions();
    case "healthcare":
      return renderHealthcareActions();
    case "factory":
      return renderFactoryActions();
    default:
      return null;
  }
};
