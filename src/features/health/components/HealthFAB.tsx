import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "../types";
import { Ambulance, CalendarDays, CalendarPlus, ShieldCheck, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthFABProps {
  userRole: UserRole;
}

const HealthFAB: React.FC<HealthFABProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* Expanded Menu Actions */}
      <div 
        className={cn(
          "flex flex-col items-end gap-3 mb-4 transition-all duration-300 origin-bottom pointer-events-auto",
          expanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-8 pointer-events-none"
        )}
      >
        {userRole === "patient" && (
          <>
            <button
              onClick={() => {
                navigate("/services/health/doctors");
                setExpanded(false);
              }}
              className="flex items-center gap-3 px-5 py-3.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full shadow-lg shadow-black/5 hover:bg-slate-50 dark:hover:bg-slate-700/90 hover:-translate-y-1 hover:shadow-xl transition-all group"
            >
              <span className="font-semibold text-sm">Regular Booking</span>
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-4 w-4" />
              </div>
            </button>

            <button
              onClick={() => {
                navigate("/services/health/doctors?emergency=true");
                setExpanded(false);
              }}
              className="flex items-center gap-3 px-5 py-3.5 bg-rose-50 dark:bg-rose-950/40 backdrop-blur-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-full shadow-lg shadow-black/5 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:-translate-y-1 hover:shadow-rose-500/20 transition-all group"
            >
              <span className="font-semibold text-sm">Emergency Request</span>
              <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/40 group-hover:scale-110 group-hover:bg-rose-600 transition-all">
                <Ambulance className="h-4 w-4" />
              </div>
            </button>
          </>
        )}

        {userRole === "doctor" && (
          <button
            onClick={() => {
              navigate("/services/health/doctor/dashboard?tab=schedule");
              setExpanded(false);
            }}
            className="flex items-center gap-3 px-5 py-3.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full shadow-lg shadow-black/5 hover:bg-slate-50 dark:hover:bg-slate-700/90 hover:-translate-y-1 hover:shadow-xl transition-all group"
          >
            <span className="font-semibold text-sm">Add Availability</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <CalendarPlus className="h-4 w-4" />
            </div>
          </button>
        )}

        {userRole === "admin" && (
          <button
            onClick={() => {
              navigate("/services/health/admin/verify");
              setExpanded(false);
            }}
            className="flex items-center gap-3 px-5 py-3.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full shadow-lg shadow-black/5 hover:bg-slate-50 dark:hover:bg-slate-700/90 hover:-translate-y-1 hover:shadow-xl transition-all group"
          >
            <span className="font-semibold text-sm">Verify Doctors</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </button>
        )}
      </div>

      {/* Main FAB Trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto hover:shadow-indigo-500/30",
          expanded 
            ? "bg-slate-800 dark:bg-slate-700 text-white rotate-180 hover:bg-slate-900 dark:hover:bg-slate-600" 
            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-105"
        )}
        aria-label="Toggle health menu"
      >
        {expanded ? (
          <X className="w-6 h-6 lg:w-7 lg:h-7" />
        ) : (
          <Plus className="w-6 h-6 lg:w-7 lg:h-7" />
        )}
      </button>

      {/* Backdrop for overlay effect (optional, uncomment if desired) */}
      {/* 
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[-1] transition-opacity duration-300 pointer-events-none",
          expanded ? "opacity-100" : "opacity-0"
        )} 
        onClick={() => setExpanded(false)}
      /> 
      */}
    </div>
  );
};

export default HealthFAB;
