import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowRightLeft, Package, TrendingUp, Download, Calendar, Plus } from "lucide-react";
import { StockEntryModal } from "@/components/forms/StockEntryModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageLoading } from "@/components/ui/message-loading";

interface StockMovement {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  movement_date: string;
  reference_document?: string;
  notes?: string;
  product_name?: string;
  product_code?: string;
  warehouse_name?: string;
  warehouse_id?: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
}

interface MovementSummary {
  total_movements: number;
  total_value: number;
  entries: number;
  exits: number;
  transfers: number;
  adjustments: number;
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<MovementSummary>({
    total_movements: 0,
    total_value: 0,
    entries: 0,
    exits: 0,
    transfers: 0,
    adjustments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showStockEntry, setShowStockEntry] = useState(false);

  useEffect(() => {
    fetchData();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch movements with related data
      const { data: movementsData, error: movementsError } = await supabase
        .from("inventory_movements")
        .select(`
          *,
          inventory_items!inner (
            id,
            product_id,
            warehouse_id,
            warehouses!inner (name),
            products!inner (name, code)
          ),
          from_warehouse:warehouses!inventory_movements_from_warehouse_id_fkey (name),
          to_warehouse:warehouses!inventory_movements_to_warehouse_id_fkey (name)
        `)
        .order("movement_date", { ascending: false })
        .limit(500);

      if (movementsError) throw movementsError;

      // Transform and enrich data
      const enrichedMovements = (movementsData || []).map(movement => ({
        ...movement,
        product_name: (movement as any).inventory_items?.products?.name || "Producto no encontrado",
        product_code: (movement as any).inventory_items?.products?.code || "N/A",
        warehouse_name: (movement as any).inventory_items?.warehouses?.name || "Depósito no encontrado",
        warehouse_id: (movement as any).inventory_items?.warehouse_id,
        from_warehouse_name: (movement as any).from_warehouse?.name,
        to_warehouse_name: (movement as any).to_warehouse?.name,
      }));

      // Calculate summary
      const total_movements = enrichedMovements.length;
      const total_value = enrichedMovements.reduce((sum, m) => sum + (m.total_value || 0), 0);
      const entries = enrichedMovements.filter(m => m.movement_type === "entrada").length;
      const exits = enrichedMovements.filter(m => m.movement_type === "salida").length;
      const transfers = enrichedMovements.filter(m => m.movement_type === "transferencia").length;
      const adjustments = enrichedMovements.filter(m => m.movement_type === "ajuste").length;

      setMovements(enrichedMovements);
      setSummary({
        total_movements,
        total_value,
        entries,
        exits,
        transfers,
        adjustments,
      });
    } catch (error) {
      console.error("Error fetching movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case "entrada": return "Entrada";
      case "salida": return "Salida";
      case "ajuste": return "Ajuste";
      case "transferencia": return "Transferencia";
      default: return type;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "entrada": return "default";
      case "salida": return "destructive";
      case "ajuste": return "secondary";
      case "transferencia": return "outline";
      default: return "default";
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || movement.movement_type === typeFilter;
    const matchesWarehouse = warehouseFilter === "all" || 
      movement.warehouse_id === warehouseFilter;

    const matchesTab = activeTab === "all" ||
      (activeTab === "purchases" && movement.movement_type === "entrada") ||
      (activeTab === "transfers" && movement.movement_type === "transferencia");

    return matchesSearch && matchesType && matchesWarehouse && matchesTab;
  });

  if (loading) {
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
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Movimientos de Stock</h1>
              <p className="text-muted-foreground">
                Historial completo de movimientos de inventario entre depósitos
              </p>
            </div>
            <Button onClick={() => setShowStockEntry(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_movements}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.total_value.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.entries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.transfers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por producto, código, referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="salida">Salidas</SelectItem>
                <SelectItem value="transferencia">Transferencias</SelectItem>
                <SelectItem value="ajuste">Ajustes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los depósitos</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todos los Movimientos</TabsTrigger>
              <TabsTrigger value="purchases">Ingresos por Compra</TabsTrigger>
              <TabsTrigger value="transfers">Transferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <MovementsTable movements={filteredMovements} />
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4">
              <MovementsTable movements={filteredMovements.filter(m => m.movement_type === "entrada")} />
            </TabsContent>

            <TabsContent value="transfers" className="space-y-4">
              <MovementsTable movements={filteredMovements.filter(m => m.movement_type === "transferencia")} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <StockEntryModal
        purchase={null}
        isOpen={showStockEntry}
        onClose={() => setShowStockEntry(false)}
        onSuccess={() => {
          setShowStockEntry(false);
          fetchData();
        }}
      />
    </MainLayout>
  );
}

interface MovementsTableProps {
  movements: StockMovement[];
}

function MovementsTable({ movements }: MovementsTableProps) {
  const getMovementTypeText = (type: string) => {
    switch (type) {
      case "entrada": return "Entrada";
      case "salida": return "Salida";
      case "ajuste": return "Ajuste";
      case "transferencia": return "Transferencia";
      default: return type;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "entrada": return "default";
      case "salida": return "destructive";
      case "ajuste": return "secondary";
      case "transferencia": return "outline";
      default: return "default";
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {movements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
            <p className="text-muted-foreground">
              No se encontraron movimientos con los filtros aplicados
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Costo Unit.</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.movement_date), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{movement.product_name}</p>
                      <p className="text-sm text-muted-foreground">{movement.product_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getMovementTypeBadge(movement.movement_type) as any}>
                      {getMovementTypeText(movement.movement_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {movement.movement_type === "salida" ? "-" : "+"}{movement.quantity}
                  </TableCell>
                  <TableCell>${movement.unit_cost}</TableCell>
                  <TableCell className="font-medium">${movement.total_value}</TableCell>
                  <TableCell>
                    {movement.movement_type === "transferencia" ? (
                      <div className="text-sm">
                        <p>{movement.from_warehouse_name} →</p>
                        <p>{movement.to_warehouse_name}</p>
                      </div>
                    ) : (
                      movement.warehouse_name
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {movement.reference_document || movement.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}