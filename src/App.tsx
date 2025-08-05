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
import SalesPage from "./pages/SalesPage";
import CollectionsPage from "./pages/CollectionsPage";
import AccountsReceivablePage from "./pages/AccountsReceivablePage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import { CustomersPage } from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CadetesPage from "./pages/CadetesPage";
import CadeteDetailPage from "./pages/CadeteDetailPage";
import VehiculosPage from "./pages/VehiculosPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFound";

// Create QueryClient outside component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
