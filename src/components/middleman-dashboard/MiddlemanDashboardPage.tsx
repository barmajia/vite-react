import { Routes, Route, Navigate } from "react-router-dom";
import { MiddlemanDashboardLayout } from "@/components/middleman-dashboard/MiddlemanDashboardLayout";
import { MiddlemanDashboard } from "@/pages/middleman/MiddlemanDashboard";
import { MiddlemanDeals } from "@/pages/middleman/MiddlemanDeals";
import { MiddlemanCreateDeal } from "@/pages/middleman/MiddlemanCreateDeal";
import { MiddlemanDealDetails } from "@/pages/middleman/MiddlemanDealDetails";
import { MiddlemanOrders } from "@/pages/middleman/MiddlemanOrders";
import { MiddlemanAnalytics } from "@/pages/middleman/MiddlemanAnalytics";
import { MiddlemanConnections } from "@/pages/middleman/MiddlemanConnections";
import { MiddlemanCommission } from "@/pages/middleman/MiddlemanCommission";
import { MiddlemanProfile } from "@/pages/middleman/MiddlemanProfile";
import { MiddlemanSettings } from "@/pages/middleman/MiddlemanSettings";

export function MiddlemanDashboardPage() {
  return (
    <Routes>
      <Route element={<MiddlemanDashboardLayout />}>
        <Route index element={<MiddlemanDashboard />} />
        <Route path="dashboard" element={<MiddlemanDashboard />} />
        <Route path="deals" element={<MiddlemanDeals />} />
        <Route path="deals/new" element={<MiddlemanCreateDeal />} />
        <Route path="deals/:dealId" element={<MiddlemanDealDetails />} />
        <Route path="orders" element={<MiddlemanOrders />} />
        <Route path="analytics" element={<MiddlemanAnalytics />} />
        <Route path="connections" element={<MiddlemanConnections />} />
        <Route path="commission" element={<MiddlemanCommission />} />
        <Route path="profile" element={<MiddlemanProfile />} />
        <Route path="settings" element={<MiddlemanSettings />} />
        <Route path="*" element={<Navigate to="/middleman/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
