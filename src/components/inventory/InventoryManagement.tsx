import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Search, 
  Filter, Scan, RefreshCw, Truck, Clock, DollarSign, BarChart3 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  unit_cost: number;
  selling_price: number;
  supplier: string;
  location: string;
  last_updated: string;
  demand_forecast: number;
  lead_time_days: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

interface StockMovement {
  id: string;
  item_id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  date: string;
  user: string;
  reference: string;
}

interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'reorder';
  item_id: string;
  item_name: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  created_at: string;
  resolved: boolean;
}

interface InventoryMetrics {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  turnover_rate: number;
  avg_lead_time: number;
}

export const InventoryManagement = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const generateInventoryData = () => {
      // Generate inventory items
      const inventoryData: InventoryItem[] = [
        {
          id: 'INV-001',
          name: 'Harina de Trigo 000',
          category: 'Harinas',
          sku: 'HAR-001',
          current_stock: 45,
          min_stock: 20,
          max_stock: 100,
          reorder_point: 30,
          unit_cost: 85,
          selling_price: 120,
          supplier: 'Molinos San Carlos',
          location: 'Depósito A-1',
          last_updated: '2024-06-01T10:30:00',
          demand_forecast: 15,
          lead_time_days: 3,
          status: 'in_stock'
        },
        {
          id: 'INV-002',
          name: 'Azúcar Blanca',
          category: 'Azúcares',
          sku: 'AZU-001',
          current_stock: 8,
          min_stock: 15,
          max_stock: 80,
          reorder_point: 20,
          unit_cost: 65,
          selling_price: 95,
          supplier: 'Ingenio La Esperanza',
          location: 'Depósito B-2',
          last_updated: '2024-05-30T14:15:00',
          demand_forecast: 12,
          lead_time_days: 5,
          status: 'low_stock'
        },
        {
          id: 'INV-003',
          name: 'Levadura Seca',
          category: 'Levaduras',
          sku: 'LEV-001',
          current_stock: 0,
          min_stock: 10,
          max_stock: 50,
          reorder_point: 15,
          unit_cost: 125,
          selling_price: 180,
          supplier: 'Calsa Argentina',
          location: 'Depósito C-1',
          last_updated: '2024-05-28T09:00:00',
          demand_forecast: 8,
          lead_time_days: 7,
          status: 'out_of_stock'
        },
        {
          id: 'INV-004',
          name: 'Sal Fina',
          category: 'Condimentos',
          sku: 'SAL-001',
          current_stock: 150,
          min_stock: 20,
          max_stock: 100,
          reorder_point: 30,
          unit_cost: 35,
          selling_price: 55,
          supplier: 'Dos Anclas',
          location: 'Depósito A-3',
          last_updated: '2024-06-01T16:45:00',
          demand_forecast: 5,
          lead_time_days: 2,
          status: 'overstock'
        }
      ];

      // Generate stock movements
      const movementData: StockMovement[] = [
        {
          id: 'MOV-001',
          item_id: 'INV-001',
          type: 'in',
          quantity: 20,
          reason: 'Recepción de compra',
          date: '2024-06-01T08:00:00',
          user: 'Juan Pérez',
          reference: 'PO-2024-001'
        },
        {
          id: 'MOV-002',
          item_id: 'INV-002',
          type: 'out',
          quantity: 12,
          reason: 'Venta cliente',
          date: '2024-05-30T11:30:00',
          user: 'María López',
          reference: 'ORD-2024-458'
        },
        {
          id: 'MOV-003',
          item_id: 'INV-003',
          type: 'out',
          quantity: 8,
          reason: 'Venta cliente',
          date: '2024-05-28T15:20:00',
          user: 'Carlos Mendez',
          reference: 'ORD-2024-445'
        }
      ];

      // Generate alerts
      const alertData: InventoryAlert[] = [
        {
          id: 'ALT-001',
          type: 'out_of_stock',
          item_id: 'INV-003',
          item_name: 'Levadura Seca',
          severity: 'high',
          message: 'Producto sin stock. Necesita reposición inmediata.',
          created_at: '2024-05-28T15:21:00',
          resolved: false
        },
        {
          id: 'ALT-002',
          type: 'low_stock',
          item_id: 'INV-002',
          item_name: 'Azúcar Blanca',
          severity: 'medium',
          message: 'Stock por debajo del mínimo. Considerar reorden.',
          created_at: '2024-05-30T12:00:00',
          resolved: false
        },
        {
          id: 'ALT-003',
          type: 'overstock',
          item_id: 'INV-004',
          item_name: 'Sal Fina',
          severity: 'low',
          message: 'Stock excesivo. Considerar promoción o redistribución.',
          created_at: '2024-06-01T17:00:00',
          resolved: false
        }
      ];

      // Generate metrics
      const inventoryMetrics: InventoryMetrics = {
        total_items: 247,
        total_value: 145890,
        low_stock_items: 8,
        out_of_stock_items: 3,
        turnover_rate: 4.2,
        avg_lead_time: 4.5
      };

      setInventory(inventoryData);
      setMovements(movementData);
      setAlerts(alertData);
      setMetrics(inventoryMetrics);
      setLoading(false);
    };

    generateInventoryData();
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'default';
      case 'low_stock': return 'destructive';
      case 'out_of_stock': return 'destructive';
      case 'overstock': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'En Stock';
      case 'low_stock': return 'Stock Bajo';
      case 'out_of_stock': return 'Sin Stock';
      case 'overstock': return 'Sobre Stock';
      default: return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleAddItem = () => {
    toast({
      title: "Producto Agregado",
      description: "El nuevo producto ha sido agregado al inventario"
    });
    setIsAddItemModalOpen(false);
  };

  const handleAddMovement = () => {
    toast({
      title: "Movimiento Registrado",
      description: "El movimiento de stock ha sido registrado correctamente"
    });
    setIsMovementModalOpen(false);
  };

  const handleReorderItem = (item: InventoryItem) => {
    toast({
      title: "Orden de Compra Generada",
      description: `Se generó automáticamente una orden de compra para ${item.name}`
    });
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stockDistribution = [
    { name: 'En Stock', value: inventory.filter(i => i.status === 'in_stock').length, color: '#10b981' },
    { name: 'Stock Bajo', value: inventory.filter(i => i.status === 'low_stock').length, color: '#f59e0b' },
    { name: 'Sin Stock', value: inventory.filter(i => i.status === 'out_of_stock').length, color: '#ef4444' },
    { name: 'Sobre Stock', value: inventory.filter(i => i.status === 'overstock').length, color: '#6b7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Inventario Inteligente</h2>
          <p className="text-muted-foreground">
            Control automatizado de stock con predicciones y alertas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo producto al inventario
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Nombre del producto" />
                  <Input placeholder="SKU" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harinas">Harinas</SelectItem>
                      <SelectItem value="azucares">Azúcares</SelectItem>
                      <SelectItem value="levaduras">Levaduras</SelectItem>
                      <SelectItem value="condimentos">Condimentos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Proveedor" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Stock mínimo" type="number" />
                  <Input placeholder="Stock máximo" type="number" />
                  <Input placeholder="Punto de reorden" type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Costo unitario" type="number" />
                  <Input placeholder="Precio de venta" type="number" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddItem}>Agregar Producto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Registrar Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
                <DialogDescription>
                  Registra una entrada, salida o ajuste de inventario
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Salida</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Cantidad" type="number" />
                </div>
                <Input placeholder="Motivo/Referencia" />
              </div>
              <DialogFooter>
                <Button onClick={handleAddMovement}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{metrics.total_items}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">${metrics.total_value.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold">{metrics.low_stock_items}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin Stock</p>
                <p className="text-2xl font-bold">{metrics.out_of_stock_items}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rotación</p>
                <p className="text-2xl font-bold">{metrics.turnover_rate}x</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lead Time Prom.</p>
                <p className="text-2xl font-bold">{metrics.avg_lead_time} días</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="Harinas">Harinas</SelectItem>
                    <SelectItem value="Azúcares">Azúcares</SelectItem>
                    <SelectItem value="Levaduras">Levaduras</SelectItem>
                    <SelectItem value="Condimentos">Condimentos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="in_stock">En Stock</SelectItem>
                    <SelectItem value="low_stock">Stock Bajo</SelectItem>
                    <SelectItem value="out_of_stock">Sin Stock</SelectItem>
                    <SelectItem value="overstock">Sobre Stock</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}>
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory List */}
          <Card>
            <CardHeader>
              <CardTitle>Productos en Inventario ({filteredInventory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.category} | SKU: {item.sku}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                        {item.current_stock <= item.reorder_point && (
                          <Button 
                            size="sm" 
                            onClick={() => handleReorderItem(item)}
                            className="flex items-center gap-1"
                          >
                            <Truck className="h-3 w-3" />
                            Reorden
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Stock Actual</p>
                        <p className="font-medium">{item.current_stock} unidades</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Demanda Predicha</p>
                        <p className="font-medium">{item.demand_forecast} unidades/semana</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Proveedor</p>
                        <p className="font-medium">{item.supplier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lead Time</p>
                        <p className="font-medium">{item.lead_time_days} días</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Nivel de Stock</span>
                        <span>{((item.current_stock / item.max_stock) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.current_stock <= item.min_stock ? 'bg-red-600' :
                            item.current_stock <= item.reorder_point ? 'bg-yellow-600' :
                            item.current_stock >= item.max_stock ? 'bg-gray-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(100, (item.current_stock / item.max_stock) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Min: {item.min_stock}</span>
                        <span>Reorden: {item.reorder_point}</span>
                        <span>Max: {item.max_stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Inventario</CardTitle>
              <CardDescription>
                Notificaciones automáticas basadas en niveles de stock y predicciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.severity === 'high' ? 'text-red-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                        }`} />
                        <div>
                          <h4 className="font-medium">{alert.item_name}</h4>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>
                Registro de todas las entradas, salidas y ajustes de inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.map((movement) => {
                  const item = inventory.find(i => i.id === movement.item_id);
                  return (
                    <div key={movement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item?.name}</h4>
                          <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Cantidad: {movement.quantity}</span>
                            <span>Usuario: {movement.user}</span>
                            <span>Ref: {movement.reference}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={movement.type === 'in' ? 'default' : movement.type === 'out' ? 'destructive' : 'secondary'}>
                            {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : movement.type}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(movement.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stockDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stockDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predicción vs Realidad</CardTitle>
                <CardDescription>
                  Comparación entre demanda predicha y consumo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={inventory.slice(0, 4).map(item => ({
                      name: item.name.substring(0, 15) + '...',
                      predicho: item.demand_forecast,
                      real: Math.floor(item.demand_forecast * (0.8 + Math.random() * 0.4))
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="predicho" fill="#8884d8" name="Predicho" />
                    <Bar dataKey="real" fill="#82ca9d" name="Real" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};