import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, FileSpreadsheet, Calendar, Filter, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  timeRange: string;
  dataTypes: string[];
  includeCharts: boolean;
}

export const ExportManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    timeRange: '30',
    dataTypes: ['orders', 'deliveries'],
    includeCharts: true
  });

  const dataTypeOptions = [
    { id: 'orders', label: 'Pedidos', icon: '📦' },
    { id: 'deliveries', label: 'Entregas', icon: '🚚' },
    
    { id: 'customers', label: 'Clientes', icon: '👥' },
    { id: 'products', label: 'Productos', icon: '📋' },
    { id: 'incidents', label: 'Incidencias', icon: '⚠️' },
    { id: 'routes', label: 'Rutas', icon: '🗺️' },
    { id: 'payments', label: 'Pagos', icon: '💳' },
    { id: 'collections', label: 'Cobros', icon: '📊' }
  ];

  const timeRangeOptions = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 3 meses' },
    { value: '180', label: 'Últimos 6 meses' },
    { value: '365', label: 'Último año' },
    { value: 'all', label: 'Todos los datos' }
  ];

  const fetchTableData = async (tableName: string, timeRange: string) => {
    const validTables = ['orders', 'deliveries', 'customers', 'products', 'incidents', 'routes', 'payments', 'collections'] as const;
    type ValidTable = typeof validTables[number];
    
    if (!validTables.includes(tableName as ValidTable)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
    
    let query = supabase.from(tableName as ValidTable).select('*');
    
    if (timeRange !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      query = query.gte('created_at', daysAgo.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const formatDataForExport = (data: any[], tableName: string) => {
    if (!data.length) return [];

    return data.map(row => {
      const formatted: any = {};
      
      Object.keys(row).forEach(key => {
        const value = row[key];
        
        // Formatear fechas
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
          formatted[key] = new Date(value).toLocaleString('es-ES');
        }
        // Formatear objetos JSON
        else if (typeof value === 'object' && value !== null) {
          formatted[key] = JSON.stringify(value);
        }
        // Formatear números
        else if (typeof value === 'number') {
          formatted[key] = tableName.includes('amount') || tableName.includes('price') || tableName.includes('cost') 
            ? `$${value.toFixed(2)}` 
            : value;
        }
        else {
          formatted[key] = value;
        }
      });
      
      return formatted;
    });
  };

  const generateExcelReport = async (allData: { [key: string]: any[] }) => {
    const workbook = XLSX.utils.book_new();

    // Crear una hoja para cada tipo de datos
    Object.entries(allData).forEach(([tableName, data]) => {
      if (data.length > 0) {
        const formattedData = formatDataForExport(data, tableName);
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        
        // Ajustar ancho de columnas
        const colWidths = Object.keys(formattedData[0] || {}).map(() => ({ wch: 15 }));
        worksheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      }
    });

    // Crear hoja de resumen
    const summaryData = Object.entries(allData).map(([table, data]) => ({
      'Tabla': table,
      'Registros': data.length,
      'Última actualización': new Date().toLocaleString('es-ES')
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Descargar archivo
    const fileName = `reporte_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const generateCSVReport = async (allData: { [key: string]: any[] }) => {
    Object.entries(allData).forEach(([tableName, data]) => {
      if (data.length > 0) {
        const formattedData = formatDataForExport(data, tableName);
        const csv = XLSX.utils.json_to_sheet(formattedData);
        const csvOutput = XLSX.utils.sheet_to_csv(csv);
        
        // Crear y descargar archivo CSV
        const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const startExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      const allData: { [key: string]: any[] } = {};
      const totalTables = exportOptions.dataTypes.length;

      // Obtener datos de cada tabla seleccionada
      for (let i = 0; i < exportOptions.dataTypes.length; i++) {
        const tableName = exportOptions.dataTypes[i];
        setExportProgress((i / totalTables) * 70);
        
        try {
          const data = await fetchTableData(tableName, exportOptions.timeRange);
          allData[tableName] = data;
        } catch (error) {
          console.error(`Error fetching ${tableName}:`, error);
          allData[tableName] = [];
        }
      }

      setExportProgress(80);

      // Generar reporte según el formato seleccionado
      if (exportOptions.format === 'xlsx') {
        await generateExcelReport(allData);
      } else if (exportOptions.format === 'csv') {
        await generateCSVReport(allData);
      }

      setExportProgress(100);

      toast({
        title: 'Exportación completada',
        description: `Reporte exportado exitosamente en formato ${exportOptions.format.toUpperCase()}`,
      });

      setIsDialogOpen(false);

    } catch (error) {
      console.error('Error durante la exportación:', error);
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo completar la exportación del reporte',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const toggleDataType = (dataType: string) => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dataType)
        ? prev.dataTypes.filter(t => t !== dataType)
        : [...prev.dataTypes, dataType]
    }));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Reportes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Reportes Avanzados
          </DialogTitle>
          <DialogDescription>
            Configura y exporta reportes personalizados de tus datos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato de exportación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Formato de archivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={exportOptions.format}
                onValueChange={(value: 'csv' | 'xlsx' | 'pdf') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx) - Recomendado</SelectItem>
                  <SelectItem value="csv">CSV (.csv) - Compatible universal</SelectItem>
                  <SelectItem value="pdf" disabled>PDF (.pdf) - Próximamente</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Rango de tiempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período de datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={exportOptions.timeRange}
                onValueChange={(value) => 
                  setExportOptions(prev => ({ ...prev, timeRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tipos de datos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Datos a incluir
              </CardTitle>
              <CardDescription>
                Selecciona las tablas que deseas incluir en el reporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {dataTypeOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.id}
                      checked={exportOptions.dataTypes.includes(option.id)}
                      onCheckedChange={() => toggleDataType(option.id)}
                    />
                    <Label 
                      htmlFor={option.id}
                      className="text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progreso de exportación */}
          {isExporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Progreso de exportación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {exportProgress < 70 
                      ? 'Obteniendo datos...' 
                      : exportProgress < 90 
                      ? 'Procesando...' 
                      : 'Generando archivo...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={startExport}
              disabled={isExporting || exportOptions.dataTypes.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Iniciar Exportación
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};