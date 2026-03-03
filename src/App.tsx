import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import UsersPage from "./pages/UsersPage";
import OrdersPage from "./pages/OrdersPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import RoutesPage from "./pages/RoutesPage";
import RouteDetailPage from "./pages/RouteDetailPage";
import IncidentsPage from "./pages/IncidentsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ProductsPage from "./pages/ProductsPage";
import FinancePage from "./pages/FinancePage";
import PurchasesPage from "./pages/PurchasesPage";
import CollectionsPage from "./pages/CollectionsPage";
import AccountsReceivablePage from "./pages/AccountsReceivablePage";
import BulkImportPage from "./pages/BulkImportPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import { RouteOptimizationPage } from './pages/RouteOptimizationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BusinessManagementPage from './pages/BusinessManagementPage';
import InventoryPage from "./pages/InventoryPage";
import StockMovementsPage from "./pages/StockMovementsPage";
import ReportsPage from "./pages/ReportsPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import { CustomersPage } from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CadetesPage from "./pages/CadetesPage";
import CadeteDetailPage from "./pages/CadeteDetailPage";
import VehiculosPage from "./pages/VehiculosPage";
import SupplierPaymentsPage from "./pages/SupplierPaymentsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ReferencesPage from "./pages/ReferencesPage";
import CashManagementPage from "./pages/CashManagementPage";
import NewLogisticsPage from "./pages/NewLogisticsPage";
import RoutesManagementPage from "./pages/RoutesManagementPage";
import RoutesViewPage from "./pages/RoutesViewPage";
import CreditoModernaPage from "./pages/CreditoModernaPage";
import AssemblyPage from "./pages/AssemblyPage";
import ArmadoresPage from "./pages/ArmadoresPage";
import WooCommerceConfigPage from "./pages/WooCommerceConfigPage";
import WooCommerceReviewPage from "./pages/WooCommerceReviewPage";
import WooCommerceProductsPage from "./pages/WooCommerceProductsPage";
import ProductSyncPage from "./pages/ProductSyncPage";
import ProductSyncHistoryPage from "./pages/ProductSyncHistoryPage";
import EcommerceCampaignsPage from "./pages/EcommerceCampaignsPage";
import KpiAnalyticsPage from "./pages/KpiAnalyticsPage";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { DemoVersionProvider } from "@/context/DemoVersionContext";
import { DemoRoute } from "@/components/demo/DemoRoute";

// Create a simple QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DemoVersionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />

            {/* V1: Comercial */}
            <Route path="/customers" element={<DemoRoute><CustomersPage /></DemoRoute>} />
            <Route path="/customers/:id" element={<DemoRoute><CustomerDetailPage /></DemoRoute>} />
            <Route path="/orders" element={<DemoRoute><OrdersPage /></DemoRoute>} />
            <Route path="/orders/:id" element={<DemoRoute><OrderDetailPage /></DemoRoute>} />
            <Route path="/deliveries" element={<DemoRoute><DeliveriesPage /></DemoRoute>} />
            <Route path="/collections" element={<DemoRoute><CollectionsPage /></DemoRoute>} />
            <Route path="/accounts-receivable" element={<DemoRoute><AccountsReceivablePage /></DemoRoute>} />

            {/* V2: Inventario + Operaciones */}
            <Route path="/products" element={<DemoRoute><ProductsPage /></DemoRoute>} />
            <Route path="/inventory" element={<DemoRoute><InventoryPage /></DemoRoute>} />
            <Route path="/stock-movements" element={<DemoRoute><StockMovementsPage /></DemoRoute>} />
            <Route path="/logistics" element={<DemoRoute><ProtectedRoute><NewLogisticsPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/routes-management" element={<DemoRoute><ProtectedRoute><RoutesManagementPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/routes" element={<DemoRoute><RoutesPage /></DemoRoute>} />
            <Route path="/routes/:id" element={<DemoRoute><RouteDetailPage /></DemoRoute>} />
            <Route path="/routes-view" element={<DemoRoute><ProtectedRoute><RoutesViewPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/route-optimization" element={<DemoRoute><RouteOptimizationPage /></DemoRoute>} />
            <Route path="/assembly" element={<DemoRoute><ProtectedRoute><AssemblyPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/armadores" element={<DemoRoute><ProtectedRoute><ArmadoresPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/cadetes" element={<DemoRoute><CadetesPage /></DemoRoute>} />
            <Route path="/cadetes/:id" element={<DemoRoute><CadeteDetailPage /></DemoRoute>} />
            <Route path="/vehiculos" element={<DemoRoute><VehiculosPage /></DemoRoute>} />

            {/* V3: Finanzas, E-commerce, Admin */}
            <Route path="/users" element={<DemoRoute><UsersPage /></DemoRoute>} />
            <Route path="/payments" element={<DemoRoute><PaymentsPage /></DemoRoute>} />
            <Route path="/finance" element={<DemoRoute><FinancePage /></DemoRoute>} />
            <Route path="/purchases" element={<DemoRoute><PurchasesPage /></DemoRoute>} />
            <Route path="/supplier-payments" element={<DemoRoute><SupplierPaymentsPage /></DemoRoute>} />
            <Route path="/bulk-import" element={<DemoRoute><BulkImportPage /></DemoRoute>} />
            <Route path="/user-management" element={<DemoRoute><UserManagementPage /></DemoRoute>} />
            <Route path="/settings" element={<DemoRoute><SettingsPage /></DemoRoute>} />
            <Route path="/references" element={<DemoRoute><ReferencesPage /></DemoRoute>} />
            <Route path="/cash-management" element={<DemoRoute><CashManagementPage /></DemoRoute>} />
            <Route path="/analytics" element={<DemoRoute><AnalyticsPage /></DemoRoute>} />
            <Route path="/business" element={<DemoRoute><BusinessManagementPage /></DemoRoute>} />
            <Route path="/reports" element={<DemoRoute><ReportsPage /></DemoRoute>} />
            <Route path="/credito-moderna" element={<DemoRoute><ProtectedRoute><CreditoModernaPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/woocommerce-config" element={<DemoRoute><ProtectedRoute><WooCommerceConfigPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/woocommerce-review" element={<DemoRoute><ProtectedRoute><WooCommerceReviewPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/woocommerce-products" element={<DemoRoute><ProtectedRoute><WooCommerceProductsPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/product-sync" element={<DemoRoute><ProtectedRoute><ProductSyncPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/product-sync-history" element={<DemoRoute><ProtectedRoute><ProductSyncHistoryPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/ecommerce-campaigns" element={<DemoRoute><ProtectedRoute><EcommerceCampaignsPage /></ProtectedRoute></DemoRoute>} />
            <Route path="/kpi-analytics" element={<DemoRoute><ProtectedRoute><KpiAnalyticsPage /></ProtectedRoute></DemoRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </DemoVersionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;