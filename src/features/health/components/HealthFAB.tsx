// src/features/health/components/HealthFAB.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ambulance,
  CalendarDays,
  CalendarPlus,
  ShieldCheck,
  X,
  Plus,
  MessageSquare,
  FileText,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HealthFABProps {
  userRole: "patient" | "doctor" | "admin";
}

const HealthFAB: React.FC<HealthFABProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleNavigation = (path: string, message?: string) => {
    setExpanded(false);
    if (message) {
      toast.info(message);
    }
    navigate(path);
  };

  const getActions = () => {
    switch (userRole) {
      case "patient":
        return [
          {
            label: "Initialize Diagnostic",
            icon: CalendarDays,
            path: "/health/doctors",
            color: "rose",
          },
          {
            label: "Emergency Deployment",
            icon: Ambulance,
            path: "/health/doctors?emergency=true",
            color: "red",
            urgent: true,
          },
          {
            label: "Biological Ledger",
            icon: FileText,
            path: "/health/patient/dashboard",
            color: "emerald",
          },
        ];
      case "doctor":
        return [
          {
            label: "Operational Schedule",
            icon: CalendarPlus,
            path: "/health/doctor/dashboard?tab=schedule",
            color: "rose",
          },
          {
            label: "Neural Messages",
            icon: MessageSquare,
            path: "/health/doctor/dashboard?tab=messages",
            color: "emerald",
          },
        ];
      case "admin":
        return [
          {
            label: "Verify Components",
            icon: ShieldCheck,
            path: "/health/admin/verify",
            color: "emerald",
          },
          {
            label: "Audit Logs",
            icon: FileText,
            path: "/health/admin/audit-logs",
            color: "amber",
          },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      red: "bg-red-500/10 text-red-500 border-red-500/20",
      indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    };
    return colors[color] || colors.rose;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Menu Actions */}
      <div
        className={cn(
          "flex flex-col items-end gap-3 mb-4 transition-all duration-300 origin-bottom",
          expanded
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-8 pointer-events-none",
        )}
      >
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          const colorClasses = getColorClasses(action.color);

          return (
            <button
              key={action.label}
              onClick={() =>
                handleNavigation(
                  action.path,
                  action.urgent ? "Priority medical signal transmitted" : undefined,
                )
              }
              className={cn(
                "flex items-center gap-3 px-4 py-3 glass bg-black/40 border border-white/10 text-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:border-white/20 transition-all group backdrop-blur-[20px]",
                action.urgent && "border-rose-500/40 bg-rose-500/5 shadow-rose-500/10"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <span className="text-[9px] font-black uppercase tracking-widest">{action.label}</span>
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all border",
                  colorClasses,
                )}
              >
                <IconComponent className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main FAB Trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:shadow-indigo-500/30",
          expanded
            ? "bg-slate-800 dark:bg-slate-700 text-white rotate-180 hover:bg-slate-900 dark:hover:bg-slate-600"
            : "bg-gradient-to-r from-rose-600 to-indigo-600 text-white hover:scale-105",
        )}
        aria-label="Toggle health menu"
      >
        {expanded ? (
          <X className="w-5 h-5 lg:w-6 lg:h-6" />
        ) : (
          <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
        )}
      </button>
    </div>
  );
};

export default HealthFAB;
