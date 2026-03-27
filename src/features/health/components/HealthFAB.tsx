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
            label: "Book Appointment",
            icon: CalendarDays,
            path: "/services/health/doctors",
            color: "indigo",
          },
          {
            label: "Emergency Request",
            icon: Ambulance,
            path: "/services/health/doctors?emergency=true",
            color: "red",
            urgent: true,
          },
          {
            label: "My Records",
            icon: FileText,
            path: "/services/health/patient/dashboard",
            color: "emerald",
          },
          {
            label: "Prescriptions",
            icon: Pill,
            path: "/services/health/patient/dashboard?tab=prescriptions",
            color: "amber",
          },
        ];
      case "doctor":
        return [
          {
            label: "My Schedule",
            icon: CalendarPlus,
            path: "/services/health/doctor/dashboard?tab=schedule",
            color: "indigo",
          },
          {
            label: "Patient Messages",
            icon: MessageSquare,
            path: "/services/health/doctor/dashboard?tab=messages",
            color: "emerald",
          },
          {
            label: "Appointments",
            icon: CalendarDays,
            path: "/services/health/doctor/dashboard?tab=appointments",
            color: "amber",
          },
        ];
      case "admin":
        return [
          {
            label: "Verify Doctors",
            icon: ShieldCheck,
            path: "/services/health/admin/verify",
            color: "emerald",
          },
          {
            label: "Audit Logs",
            icon: FileText,
            path: "/services/health/admin/audit-logs",
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
      indigo:
        "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
      emerald:
        "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
      amber:
        "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
      red: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
    };
    return colors[color] || colors.indigo;
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
                  action.urgent ? "Emergency request initiated" : undefined,
                )
              }
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full shadow-lg shadow-black/5 hover:-translate-y-1 hover:shadow-xl transition-all group",
                action.urgent &&
                  "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:shadow-red-500/20",
              )}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <span className="font-semibold text-sm">{action.label}</span>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform",
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
          "w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:shadow-indigo-500/30",
          expanded
            ? "bg-slate-800 dark:bg-slate-700 text-white rotate-180 hover:bg-slate-900 dark:hover:bg-slate-600"
            : "bg-gradient-to-r from-rose-600 to-indigo-600 text-white hover:scale-105",
        )}
        aria-label="Toggle health menu"
      >
        {expanded ? (
          <X className="w-6 h-6 lg:w-7 lg:h-7" />
        ) : (
          <Plus className="w-6 h-6 lg:w-7 lg:h-7" />
        )}
      </button>
    </div>
  );
};

export default HealthFAB;
