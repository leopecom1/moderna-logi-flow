import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { CreateCollectionModal } from "@/components/forms/CreateCollectionModal";
import { Search, AlertTriangle, TrendingUp, DollarSign, Users, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageLoading } from "@/components/ui/message-loading";

export default function AccountsReceivablePage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const navigate = useNavigate();

  const { data: accountsReceivable, isLoading, refetch } = useQuery({
    queryKey: ["accounts_receivable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select(`
          *,
          customer:customers(name, phone, email, address, city)
        `)
        .order("balance_due", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredAccounts = accountsReceivable?.filter(account =>
    account.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.customer?.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Estadísticas
  const totalCustomers = accountsReceivable?.length || 0;
  const totalSales = accountsReceivable?.reduce((sum, account) => sum + Number(account.total_sales), 0) || 0;
  const totalCollections = accountsReceivable?.reduce((sum, account) => sum + Number(account.total_collections), 0) || 0;
  const totalBalanceDue = accountsReceivable?.reduce((sum, account) => sum + Number(account.balance_due), 0) || 0;
  
  const overdueAccounts = accountsReceivable?.filter(account => 
    Number(account.balance_due) > 0 && account.days_since_last_sale && account.days_since_last_sale > 30
  ).length || 0;

  const getStatusBadge = (status: string) => {
    const config = {
      normal: { label: 'Normal', variant: 'default' as const },
      warning: { label: 'Advertencia', variant: 'secondary' as const },
      blocked: { label: 'Bloqueado', variant: 'destructive' as const },
      suspended: { label: 'Suspendido', variant: 'outline' as const },
    };
    const statusConfig = config[status as keyof typeof config];
    return <Badge variant={statusConfig?.variant || 'secondary'}>{statusConfig?.label || status}</Badge>;
  };

  const getBalanceBadge = (balance: number, days: number | null) => {
    if (balance <= 0) return <Badge variant="default" className="text-green-600">Al día</Badge>;
    if (days && days > 60) return <Badge variant="destructive">Muy vencido</Badge>;
    if (days && days > 30) return <Badge variant="secondary">Vencido</Badge>;
    return <Badge variant="outline">Pendiente</Badge>;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <MessageLoading />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cuentas por Cobrar</h1>
        <CreateCollectionModal onCollectionCreated={refetch} />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              En ventas acumuladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobros Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalCollections.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              En cobros realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalBalanceDue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overdueAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Más de 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de cuentas por cobrar */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Cuentas por Cobrar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Total Ventas</TableHead>
                <TableHead>Total Cobros</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead>Días desde Última Venta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Situación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.customer?.name || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.customer?.city}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {account.customer?.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {account.customer.phone}
                        </div>
                      )}
                      {account.customer?.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {account.customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(account.total_sales).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    ${Number(account.total_collections).toFixed(2)}
                  </TableCell>
                  <TableCell className={`font-bold ${Number(account.balance_due) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Number(account.balance_due).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {account.days_since_last_sale ? (
                      <Badge variant={account.days_since_last_sale > 60 ? "destructive" : account.days_since_last_sale > 30 ? "secondary" : "outline"}>
                        {account.days_since_last_sale} días
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(account.credit_status)}
                  </TableCell>
                  <TableCell>
                    {getBalanceBadge(Number(account.balance_due), account.days_since_last_sale)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/customers/${account.customer_id}`)}
                      >
                        Ver Cliente
                      </Button>
                      {Number(account.balance_due) > 0 && (
                        <CreateCollectionModal
                          customerId={account.customer_id}
                          onCollectionCreated={refetch}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay cuentas por cobrar</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "No se encontraron cuentas con ese criterio de búsqueda." : "No hay cuentas registradas."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}