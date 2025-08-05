import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Filter,
  BarChart3,
  Table,
  PieChart,
  TrendingUp,
  Calendar,
  Users,
  Package,
  Truck,
  DollarSign
} from 'lucide-react';

interface ReportConfig {
  id?: string;
  name: string;
  description: string;
  dataSource: string;
  columns: string[];
  filters: FilterConfig[];
  groupBy: string[];
  aggregations: AggregationConfig[];
  chartType: 'table' | 'bar' | 'line' | 'pie' | 'area';
  timeRange: string;
}

interface FilterConfig {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string;
  value2?: string; // Para operador 'between'
}

interface AggregationConfig {
  column: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  alias: string;
}

const tableDefinitions = {
  orders: {
    label: 'Pedidos',
    icon: Package,
    columns: ['order_number', 'status', 'total_amount', 'delivery_date', 'created_at'],
    numericColumns: ['total_amount'],
    dateColumns: ['delivery_date', 'created_at']
  },
  deliveries: {
    label: 'Entregas',
    icon: Truck,
    columns: ['status', 'delivered_at', 'attempted_at'],
    numericColumns: [],
    dateColumns: ['delivered_at', 'attempted_at', 'created_at']
  },
  sales: {
    label: 'Ventas',
    icon: DollarSign,
    columns: ['sale_date', 'quantity', 'unit_price', 'total_amount'],
    numericColumns: ['quantity', 'unit_price', 'total_amount'],
    dateColumns: ['sale_date']
  },
  customers: {
    label: 'Clientes',
    icon: Users,
    columns: ['name', 'city', 'neighborhood', 'created_at'],
    numericColumns: [],
    dateColumns: ['created_at']
  }
};

export const CustomReportBuilder = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    dataSource: 'orders',
    columns: [],
    filters: [],
    groupBy: [],
    aggregations: [],
    chartType: 'table',
    timeRange: '30'
  });
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [reportResult, setReportResult] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([]);

  const addFilter = () => {
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { column: '', operator: 'equals', value: '' }]
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const updateFilter = (index: number, field: keyof FilterConfig, value: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const addAggregation = () => {
    setReportConfig(prev => ({
      ...prev,
      aggregations: [...prev.aggregations, { column: '', function: 'count', alias: '' }]
    }));
  };

  const removeAggregation = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      aggregations: prev.aggregations.filter((_, i) => i !== index)
    }));
  };

  const updateAggregation = (index: number, field: keyof AggregationConfig, value: string) => {
    setReportConfig(prev => ({
      ...prev,
      aggregations: prev.aggregations.map((agg, i) => 
        i === index ? { ...agg, [field]: value } : agg
      )
    }));
  };

  const toggleColumn = (column: string) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }));
  };

  const toggleGroupBy = (column: string) => {
    setReportConfig(prev => ({
      ...prev,
      groupBy: prev.groupBy.includes(column)
        ? prev.groupBy.filter(c => c !== column)
        : [...prev.groupBy, column]
    }));
  };

  const buildQuery = async () => {
    const validTables = ['orders', 'deliveries', 'sales', 'customers'] as const;
    type ValidTable = typeof validTables[number];
    
    if (!validTables.includes(reportConfig.dataSource as ValidTable)) {
      throw new Error(`Invalid table: ${reportConfig.dataSource}`);
    }
    
    let query = supabase.from(reportConfig.dataSource as ValidTable).select('*');

    // Aplicar filtros de tiempo
    if (reportConfig.timeRange !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(reportConfig.timeRange));
      query = query.gte('created_at', daysAgo.toISOString());
    }

    return query;
  };

  const executeReport = async () => {
    try {
      setIsExecuting(true);
      const query = await buildQuery();
      const { data, error } = await query;

      if (error) throw error;

      // Aplicar agregaciones y agrupaciones localmente si es necesario
      let processedData = data || [];

      if (reportConfig.groupBy.length > 0) {
        processedData = processGroupBy(processedData);
      }

      setReportResult(processedData);
      
      toast({
        title: 'Reporte ejecutado',
        description: `Se obtuvieron ${processedData.length} registros`,
      });

    } catch (error) {
      console.error('Error executing report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar el reporte',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const processGroupBy = (data: any[]) => {
    if (reportConfig.groupBy.length === 0) return data;

    const grouped = data.reduce((acc, row) => {
      const key = reportConfig.groupBy.map(col => row[col]).join('|');
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      
      return acc;
    }, {});

    return Object.entries(grouped).map(([key, rows]: [string, any]) => {
      const result: any = {};
      
      // Agregar campos de agrupación
      reportConfig.groupBy.forEach((col, i) => {
        result[col] = key.split('|')[i];
      });

      // Aplicar agregaciones
      reportConfig.aggregations.forEach(agg => {
        const values = rows.map((row: any) => Number(row[agg.column]) || 0);
        
        switch (agg.function) {
          case 'count':
            result[agg.alias || `${agg.function}_${agg.column}`] = rows.length;
            break;
          case 'sum':
            result[agg.alias || `${agg.function}_${agg.column}`] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[agg.alias || `${agg.function}_${agg.column}`] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'min':
            result[agg.alias || `${agg.function}_${agg.column}`] = Math.min(...values);
            break;
          case 'max':
            result[agg.alias || `${agg.function}_${agg.column}`] = Math.max(...values);
            break;
        }
      });

      return result;
    });
  };

  const saveReport = async () => {
    if (!reportConfig.name) {
      toast({
        title: 'Error',
        description: 'Ingresa un nombre para el reporte',
        variant: 'destructive',
      });
      return;
    }

    try {
      // En una implementación real, esto se guardaría en la base de datos
      const newReport = { ...reportConfig, id: Date.now().toString() };
      setSavedReports(prev => [...prev, newReport]);
      
      toast({
        title: 'Reporte guardado',
        description: 'El reporte se guardó exitosamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el reporte',
        variant: 'destructive',
      });
    }
  };

  const currentTable = tableDefinitions[reportConfig.dataSource as keyof typeof tableDefinitions];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Constructor de Reportes
          </h2>
          <p className="text-muted-foreground">
            Crea reportes personalizados con filtros y agregaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveReport}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          <Button onClick={executeReport} disabled={isExecuting}>
            {isExecuting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Ejecutar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="result">Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Reporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Nombre del Reporte</Label>
                  <Input
                    id="reportName"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Ventas mensuales por región"
                  />
                </div>
                <div>
                  <Label htmlFor="reportDescription">Descripción</Label>
                  <Textarea
                    id="reportDescription"
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el propósito del reporte..."
                  />
                </div>
                <div>
                  <Label>Fuente de Datos</Label>
                  <Select
                    value={reportConfig.dataSource}
                    onValueChange={(value) => setReportConfig(prev => ({ 
                      ...prev, 
                      dataSource: value,
                      columns: [],
                      filters: [],
                      groupBy: []
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tableDefinitions).map(([key, def]) => {
                        const Icon = def.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {def.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Selección de columnas */}
            <Card>
              <CardHeader>
                <CardTitle>Columnas a Incluir</CardTitle>
                <CardDescription>
                  Selecciona las columnas que quieres ver en el reporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentTable.columns.map(column => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={reportConfig.columns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <Label htmlFor={column} className="text-sm">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </span>
                  <Button variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportConfig.filters.map((filter, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Select
                        value={filter.column}
                        onValueChange={(value) => updateFilter(index, 'column', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Columna" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentTable.columns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(index, 'operator', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual a</SelectItem>
                          <SelectItem value="contains">Contiene</SelectItem>
                          <SelectItem value="greater_than">Mayor que</SelectItem>
                          <SelectItem value="less_than">Menor que</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5">
                      <Input
                        className="h-8"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="Valor"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeFilter(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {reportConfig.filters.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay filtros configurados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Agrupación y agregaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Agrupación y Agregaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Agrupar por</Label>
                  <div className="space-y-2 mt-2">
                    {currentTable.columns.map(column => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${column}`}
                          checked={reportConfig.groupBy.includes(column)}
                          onCheckedChange={() => toggleGroupBy(column)}
                        />
                        <Label htmlFor={`group-${column}`} className="text-sm">
                          {column}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Agregaciones</Label>
                    <Button variant="outline" size="sm" onClick={addAggregation}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {reportConfig.aggregations.map((agg, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <Select
                            value={agg.function}
                            onValueChange={(value) => updateAggregation(index, 'function', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="count">Contar</SelectItem>
                              <SelectItem value="sum">Sumar</SelectItem>
                              <SelectItem value="avg">Promedio</SelectItem>
                              <SelectItem value="min">Mínimo</SelectItem>
                              <SelectItem value="max">Máximo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={agg.column}
                            onValueChange={(value) => updateAggregation(index, 'column', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Columna" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentTable.columns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5">
                          <Input
                            className="h-8"
                            value={agg.alias}
                            onChange={(e) => updateAggregation(index, 'alias', e.target.value)}
                            placeholder="Nombre"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeAggregation(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultado del Reporte</CardTitle>
              <CardDescription>
                {reportResult.length} registros encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportResult.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(reportResult[0]).map(key => (
                          <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportResult.slice(0, 100).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportResult.length > 100 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando los primeros 100 registros de {reportResult.length}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Table className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Ejecuta el reporte para ver los resultados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};