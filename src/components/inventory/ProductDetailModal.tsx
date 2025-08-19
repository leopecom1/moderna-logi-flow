import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, History, DollarSign, Calendar, Warehouse } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  warehouseId: string;
}

interface CostHistory {
  date: string;
  cost: number;
  reference?: string;
  movement_type: string;
}

interface MovementHistory {
  id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  movement_date: string;
  reference_document?: string;
  notes?: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
}

export function ProductDetailModal({ isOpen, onClose, productId, warehouseId }: ProductDetailModalProps) {
  const [product, setProduct] = useState<any>(null);
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [costHistory, setCostHistory] = useState<CostHistory[]>([]);
  const [movementHistory, setMovementHistory] = useState<MovementHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && productId && warehouseId) {
      fetchProductDetails();
    }
  }, [isOpen, productId, warehouseId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);

      // Fetch product info
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      // Fetch inventory item
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_items")
        .select(`
          *,
          warehouses:warehouse_id (name)
        `)
        .eq("product_id", productId)
        .eq("warehouse_id", warehouseId)
        .single();

      if (inventoryError) throw inventoryError;

      // Fetch movement history with cost tracking
      const { data: movementsData, error: movementsError } = await supabase
        .from("inventory_movements")
        .select(`
          *,
          from_warehouse:warehouses!from_warehouse_id (name),
          to_warehouse:warehouses!to_warehouse_id (name)
        `)
        .eq("inventory_item_id", inventoryData.id)
        .order("movement_date", { ascending: false });

      if (movementsError) throw movementsError;

      // Transform movement data
      const movements = (movementsData || []).map(movement => ({
        ...movement,
        from_warehouse_name: (movement as any).from_warehouse?.name,
        to_warehouse_name: (movement as any).to_warehouse?.name,
      }));

      // Create cost history from movements
      const costs: CostHistory[] = (movementsData || [])
        .filter(m => m.unit_cost > 0)
        .map(movement => ({
          date: movement.movement_date,
          cost: movement.unit_cost,
          reference: movement.reference_document,
          movement_type: movement.movement_type,
        }));

      setProduct(productData);
      setInventoryItem(inventoryData);
      setMovementHistory(movements);
      setCostHistory(costs);
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = () => {
    if (!inventoryItem) return { status: "normal", color: "default", text: "Stock Normal" };
    
    if (inventoryItem.current_stock <= inventoryItem.minimum_stock) {
      return { status: "low", color: "destructive", text: "Stock Bajo" };
    } else if (inventoryItem.current_stock >= inventoryItem.maximum_stock) {
      return { status: "high", color: "secondary", text: "Stock Alto" };
    }
    return { status: "normal", color: "default", text: "Stock Normal" };
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product?.name || "Cargando..."}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Cargando detalles...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-medium">{product?.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium">{product?.category || "Sin categoría"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{product?.brand || "Sin marca"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stock Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{inventoryItem?.current_stock || 0}</span>
                    <Badge variant={getStockStatus().color as any}>
                      {getStockStatus().text}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mín.</p>
                      <p className="font-medium">{inventoryItem?.minimum_stock || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Máx.</p>
                      <p className="font-medium">{inventoryItem?.maximum_stock || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Costos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Actual</p>
                    <p className="text-xl font-bold">${inventoryItem?.unit_cost || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium">${((inventoryItem?.current_stock || 0) * (inventoryItem?.unit_cost || 0)).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for History */}
            <Tabs defaultValue="movements" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="movements" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historial de Movimientos
                </TabsTrigger>
                <TabsTrigger value="costs" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Historial de Costos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="movements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Movimientos de Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {movementHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No hay movimientos registrados</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Costo Unit.</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Referencia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movementHistory.map((movement) => (
                            <TableRow key={movement.id}>
                              <TableCell>
                                {format(new Date(movement.movement_date), "dd/MM/yyyy", { locale: es })}
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
                              <TableCell>${movement.total_value}</TableCell>
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
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evolución de Costos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {costHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No hay historial de costos disponible</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Costo Unitario</TableHead>
                            <TableHead>Tipo de Movimiento</TableHead>
                            <TableHead>Referencia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costHistory.map((cost, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {format(new Date(cost.date), "dd/MM/yyyy", { locale: es })}
                              </TableCell>
                              <TableCell className="font-medium">
                                ${cost.cost}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getMovementTypeBadge(cost.movement_type) as any}>
                                  {getMovementTypeText(cost.movement_type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {cost.reference || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}