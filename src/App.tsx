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
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import NotFound from "./pages/NotFound";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/cadetes" element={<CadetesPage />} />
            <Route path="/cadetes/:id" element={<CadeteDetailPage />} />
            <Route path="/vehiculos" element={<VehiculosPage />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/routes/:id" element={<RouteDetailPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/supplier-payments" element={<SupplierPaymentsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            
            <Route path="/bulk-import" element={<BulkImportPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/references" element={<ReferencesPage />} />
            <Route path="/cash-management" element={<CashManagementPage />} />
            <Route path="/route-optimization" element={<RouteOptimizationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/business" element={<BusinessManagementPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/stock-movements" element={<StockMovementsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/credito-moderna" element={<ProtectedRoute><CreditoModernaPage /></ProtectedRoute>} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/logistics" element={<ProtectedRoute><NewLogisticsPage /></ProtectedRoute>} />
            <Route path="/routes-management" element={<ProtectedRoute><RoutesManagementPage /></ProtectedRoute>} />
            <Route path="/routes-view" element={<ProtectedRoute><RoutesViewPage /></ProtectedRoute>} />
            <Route path="/assembly" element={<ProtectedRoute><AssemblyPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;