import { Routes, Route, Navigate } from "react-router-dom";
import { ShopDashboardLayout } from "@/components/shop-dashboard/ShopDashboardLayout";
import { ShopOverview } from "@/components/shop-dashboard/ShopOverview";
import { ShopSettings } from "@/components/shop-dashboard/ShopSettings";
import { ProductManager } from "@/components/shop-dashboard/ProductManager";
import { AppearanceCustomizer } from "@/components/shop-dashboard/AppearanceCustomizer";
import { AnalyticsPanel } from "@/components/shop-dashboard/AnalyticsPanel";
import { TemplateMarketplace } from "@/components/shop-dashboard/TemplateMarketplace";

export function ShopDashboard() {
  return (
    <Routes>
      <Route element={<ShopDashboardLayout />}>
        <Route index element={<ShopOverview />} />
        <Route path="settings" element={<ShopSettings />} />
        <Route path="products" element={<ProductManager />} />
        <Route path="appearance" element={<AppearanceCustomizer />} />
        <Route path="analytics" element={<AnalyticsPanel />} />
        <Route path="marketplace" element={<TemplateMarketplace />} />
        <Route path="*" element={<Navigate to="/shops/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
