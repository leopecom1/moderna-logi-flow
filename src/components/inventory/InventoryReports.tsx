import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageLoading } from "@/components/ui/message-loading";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileDown, BarChart3, PieChartIcon, AlertTriangle, DollarSign } from "lucide-react";

interface InventoryReport {
  id: string;
  product_name: string;
  product_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_cost: number;
  total_value: number;
  category?: string;
  brand?: string;
}

interface StockAlert {
  id: string;
  product_name: string;
  product_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
}

interface Warehouse {
  id: string;
  name: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function InventoryReports() {
  const [reportData, setReportData] = useState<InventoryReport[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [reportType, setReportType] = useState<'valorizado' | 'stock' | 'alertas'>('valorizado');
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [selectedWarehouse]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Build query for inventory report
      let query = supabase
        .from("inventory_items")
        .select(`
          id,
          current_stock,
          minimum_stock,
          maximum_stock,
          unit_cost,
          products(name, code, category, brand),
          warehouses(name)
        `);

      if (selectedWarehouse !== "all") {
        query = query.eq("warehouse_id", selectedWarehouse);
      }

      const { data: inventoryData, error: inventoryError } = await query.order("products(name)");
      if (inventoryError) throw inventoryError;

      // Transform data for reports
      const transformedData: InventoryReport[] = inventoryData?.map(item => ({
        id: item.id,
        product_name: item.products?.name || 'Sin nombre',
        product_code: item.products?.code || 'Sin código',
        warehouse_name: item.warehouses?.name || 'Sin depósito',
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock || 0,
        maximum_stock: item.maximum_stock || 0,
        unit_cost: item.unit_cost,
        total_value: item.current_stock * item.unit_cost,
        category: item.products?.category,
        brand: item.products?.brand,
      })) || [];

      // Generate stock alerts
      const alerts: StockAlert[] = transformedData
        .filter(item => {
          return item.current_stock <= item.minimum_stock || 
                 item.current_stock >= item.maximum_stock ||
                 item.current_stock === 0;
        })
        .map(item => ({
          id: item.id,
          product_name: item.product_name,
          product_code: item.product_code,
          warehouse_name: item.warehouse_name,
          current_stock: item.current_stock,
          minimum_stock: item.minimum_stock,
          alert_type: item.current_stock === 0 ? 'out_of_stock' :
                     item.current_stock <= item.minimum_stock ? 'low_stock' : 'overstock'
        }));

      // Fetch warehouses for filter
      const { data: warehousesData, error: warehousesError } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (warehousesError) throw warehousesError;

      setReportData(transformedData);
      setStockAlerts(alerts);
      setWarehouses(warehousesData || []);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateValuationReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const totalValue = reportData.reduce((sum, item) => sum + item.total_value, 0);
      const totalItems = reportData.reduce((sum, item) => sum + item.current_stock, 0);

      const valuationData = {
        warehouse_id: selectedWarehouse === "all" ? warehouses[0]?.id : selectedWarehouse,
        valuation_date: new Date().toISOString().split('T')[0],
        total_items: totalItems,
        total_value: totalValue,
        valuation_data: reportData,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("inventory_valuations")
        .insert([valuationData]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Reporte de valorización generado correctamente",
      });
    } catch (error: any) {
      console.error("Error generating valuation:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    let csvContent = "";
    let headers = "";
    let rows = "";

    if (reportType === 'valorizado') {
      headers = "Producto,Código,Depósito,Stock,Costo Unitario,Valor Total,Categoría,Marca\n";
      rows = reportData.map(item => 
        `"${item.product_name}","${item.product_code}","${item.warehouse_name}",${item.current_stock},${item.unit_cost},${item.total_value},"${item.category || ''}","${item.brand || ''}"`
      ).join("\n");
    } else if (reportType === 'alertas') {
      headers = "Producto,Código,Depósito,Stock Actual,Stock Mínimo,Tipo de Alerta\n";
      rows = stockAlerts.map(alert => 
        `"${alert.product_name}","${alert.product_code}","${alert.warehouse_name}",${alert.current_stock},${alert.minimum_stock},"${alert.alert_type}"`
      ).join("\n");
    }

    csvContent = headers + rows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte_inventario_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Chart data preparation
  const categoryData = reportData.reduce((acc, item) => {
    const category = item.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, total_value: 0 };
    }
    acc[category].value += item.current_stock;
    acc[category].total_value += item.total_value;
    return acc;
  }, {} as Record<string, { name: string; value: number; total_value: number }>);

  const chartData = Object.values(categoryData);

  const warehouseData = reportData.reduce((acc, item) => {
    if (!acc[item.warehouse_name]) {
      acc[item.warehouse_name] = { name: item.warehouse_name, items: 0, value: 0 };
    }
    acc[item.warehouse_name].items += item.current_stock;
    acc[item.warehouse_name].value += item.total_value;
    return acc;
  }, {} as Record<string, { name: string; items: number; value: number }>);

  const warehouseChartData = Object.values(warehouseData);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <MessageLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por depósito" />
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

          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="valorizado">Reporte Valorizado</SelectItem>
              <SelectItem value="stock">Análisis de Stock</SelectItem>
              <SelectItem value="alertas">Alertas de Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          {reportType === 'valorizado' && (
            <Button onClick={generateValuationReport}>
              <DollarSign className="h-4 w-4 mr-2" />
              Generar Valorización
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.reduce((sum, item) => sum + item.current_stock, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.reduce((sum, item) => sum + item.total_value, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stockAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {reportType === 'valorizado' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Categoría (Cantidad)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor por Depósito</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={warehouseChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Valor']} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'valorizado' && (
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Inventario Valorizado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Costo Unit.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Categoría</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.product_code}</TableCell>
                    <TableCell>{item.warehouse_name}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>${item.unit_cost}</TableCell>
                    <TableCell className="font-semibold">${item.total_value.toLocaleString()}</TableCell>
                    <TableCell>{item.category || 'Sin categoría'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'alertas' && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Stock Actual</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Tipo de Alerta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.product_name}</TableCell>
                    <TableCell>{alert.product_code}</TableCell>
                    <TableCell>{alert.warehouse_name}</TableCell>
                    <TableCell>
                      <span className={alert.current_stock === 0 ? "text-red-600 font-bold" : ""}">
                        {alert.current_stock}
                      </span>
                    </TableCell>
                    <TableCell>{alert.minimum_stock}</TableCell>
                    <TableCell>
                      {alert.alert_type === 'out_of_stock' && (
                        <span className="text-red-600 font-semibold">Sin Stock</span>
                      )}
                      {alert.alert_type === 'low_stock' && (
                        <span className="text-yellow-600 font-semibold">Stock Bajo</span>
                      )}
                      {alert.alert_type === 'overstock' && (
                        <span className="text-blue-600 font-semibold">Sobrestock</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'stock' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items por Depósito</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={warehouseChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="items" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}