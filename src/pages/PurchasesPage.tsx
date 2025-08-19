import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter, Truck, DollarSign, Package, FileText, PackageCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CreatePurchaseModal } from "@/components/forms/CreatePurchaseModal";
import { PurchasesConfigurationModal } from "@/components/forms/PurchasesConfigurationModal";
import { ViewPurchaseModal } from "@/components/forms/ViewPurchaseModal";
import { StockEntryModal } from "@/components/forms/StockEntryModal";

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  is_import: boolean;
  currency: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  status: string;
  created_at: string;
  exchange_rate?: number;
  payment_days?: number;
  payment_method?: string;
  is_check_payment?: boolean;
  notes?: string;
  suppliers: {
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
}

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedPurchase, setSelectedPurchase] = React.useState<Purchase | null>(null);
  const [stockEntryPurchase, setStockEntryPurchase] = React.useState<Purchase | null>(null);

  const { data: purchases, isLoading, refetch } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          suppliers (
            name,
            contact_person,
            email,
            phone,
            address
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredPurchases = purchases?.filter(purchase =>
    purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purchase.suppliers?.name && purchase.suppliers.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      UYU: "$U",
      USD: "US$",
      BRL: "R$",
      ARS: "$AR"
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "destructive";
      case "confirmado": return "default";
      case "recibido": return "secondary";
      default: return "outline";
    }
  };

  const getTypeColor = (isImport: boolean) => {
    return isImport ? "default" : "secondary";
  };

  const stats = {
    total: purchases?.length || 0,
    pending: purchases?.filter(p => p.status === "pendiente").length || 0,
    imports: purchases?.filter(p => p.is_import).length || 0,
    totalAmount: purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
            <p className="text-muted-foreground">
              Gestiona las órdenes de compra a proveedores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PurchasesConfigurationModal onConfigurationUpdated={refetch} />
            <CreatePurchaseModal onPurchaseCreated={refetch} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Importaciones</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.imports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$U {stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtra las compras por diferentes criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de compra o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Compras</CardTitle>
            <CardDescription>
              Todas las órdenes de compra registradas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        Cargando compras...
                      </TableCell>
                    </TableRow>
                  ) : filteredPurchases?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No hay compras registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases?.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.purchase_number}
                        </TableCell>
                        <TableCell>
                          {purchase.suppliers?.name || "Sin proveedor"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(purchase.purchase_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(purchase.is_import)}>
                            {purchase.is_import ? "Importación" : "Plaza"}
                          </Badge>
                        </TableCell>
                        <TableCell>{purchase.currency}</TableCell>
                        <TableCell>
                          {formatCurrency(purchase.total_amount, purchase.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(purchase.status)}>
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPurchase(purchase)}
                            >
                              Ver
                            </Button>
                            {purchase.status === 'confirmado' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => setStockEntryPurchase(purchase)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <PackageCheck className="h-4 w-4 mr-1" />
                                Ingresar Stock
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Purchase Modal */}
        <ViewPurchaseModal
          purchase={selectedPurchase}
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />

        {/* Stock Entry Modal */}
        <StockEntryModal
          purchase={stockEntryPurchase}
          isOpen={!!stockEntryPurchase}
          onClose={() => setStockEntryPurchase(null)}
          onSuccess={() => {
            setStockEntryPurchase(null);
            refetch();
          }}
        />
      </div>
    </MainLayout>
  );
}