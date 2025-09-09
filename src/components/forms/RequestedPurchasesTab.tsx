import React, { useState, useEffect } from "react";
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
import { ShoppingCart, Package, CheckCircle, X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RequestedPurchase {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_cost: number;
  supplier_id?: string;
  notes?: string;
  status: string;
  requested_at: string;
  requested_by: string;
  received_at?: string;
  received_by?: string;
  orders?: {
    order_number: string;
    customers?: {
      name: string;
    };
  };
  products?: {
    name: string;
    code: string;
  };
  suppliers?: {
    name: string;
  };
}

export function RequestedPurchasesTab() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: requestedPurchases, isLoading, refetch } = useQuery({
    queryKey: ["requested-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requested_purchases")
        .select(`
          *,
          orders!inner (
            order_number,
            customers (
              name
            )
          ),
          products (
            name,
            code
          ),
          suppliers (
            name
          )
        `)
        .order("requested_at", { ascending: false });
      
      if (error) throw error;
      return data as RequestedPurchase[];
    },
  });

  const filteredRequests = requestedPurchases?.filter(request =>
    request.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.products?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.orders?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "destructive";
      case "solicitado": return "default";
      case "recibido": return "secondary";
      case "cancelado": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente": return <AlertTriangle className="h-4 w-4" />;
      case "solicitado": return <ShoppingCart className="h-4 w-4" />;
      case "recibido": return <CheckCircle className="h-4 w-4" />;
      case "cancelado": return <X className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'recibido') {
        updateData.received_at = new Date().toISOString();
        updateData.received_by = profile?.user_id;
      }

      const { error } = await supabase
        .from('requested_purchases')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Estado actualizado', {
        description: `El estado se cambió a ${newStatus}`,
      });

      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error', {
        description: 'No se pudo actualizar el estado',
      });
    }
  };

  const addToStock = async (request: RequestedPurchase) => {
    try {
      // Buscar el item de inventario correspondiente
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', request.product_id)
        .eq('variant_id', request.variant_id || null)
        .single();

      if (inventoryError || !inventoryItem) {
        toast.error('Error', {
          description: 'No se encontró el item de inventario',
        });
        return;
      }

      // Crear movimiento de entrada
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([{
          inventory_item_id: inventoryItem.id,
          movement_type: 'entrada',
          quantity: request.quantity,
          unit_cost: request.unit_cost,
          notes: `Entrada por compra solicitada - Pedido: ${request.orders?.order_number}`,
          user_id: profile?.user_id,
          reference_document: request.orders?.order_number,
        }]);

      if (movementError) throw movementError;

      // Marcar como recibido
      await updateStatus(request.id, 'recibido');

      toast.success('Stock agregado', {
        description: `Se agregaron ${request.quantity} unidades al inventario`,
      });

    } catch (error) {
      console.error('Error adding to stock:', error);
      toast.error('Error', {
        description: 'No se pudo agregar al stock',
      });
    }
  };

  const stats = {
    pending: requestedPurchases?.filter(r => r.status === 'pendiente').length || 0,
    requested: requestedPurchases?.filter(r => r.status === 'solicitado').length || 0,
    received: requestedPurchases?.filter(r => r.status === 'recibido').length || 0,
    total: requestedPurchases?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requested}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.received}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busca compras solicitadas por producto, código o pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por producto, código de producto o número de pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compras Solicitadas</CardTitle>
          <CardDescription>
            Productos que necesitan ser comprados para completar pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo Unit.</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6">
                      Cargando compras solicitadas...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6">
                      No hay compras solicitadas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.orders?.order_number}
                      </TableCell>
                      <TableCell>
                        {request.orders?.customers?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.products?.name}</div>
                          <div className="text-sm text-muted-foreground">{request.products?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>
                        ${request.unit_cost.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {request.suppliers?.name || "No asignado"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.requested_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {request.status === 'pendiente' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateStatus(request.id, 'solicitado')}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Solicitar
                            </Button>
                          )}
                          {request.status === 'solicitado' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => addToStock(request)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Agregar Stock
                            </Button>
                          )}
                          {(request.status === 'pendiente' || request.status === 'solicitado') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateStatus(request.id, 'cancelado')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
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
    </div>
  );
}