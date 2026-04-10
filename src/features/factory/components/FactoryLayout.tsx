import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FactorySidebar } from "@/features/factory/components/FactorySidebar";
import { FactoryHeader } from "@/features/factory/components/FactoryHeader";
import { Loader2 } from "lucide-react";

export function FactoryLayout() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/factory/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <FactorySidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <FactoryHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
