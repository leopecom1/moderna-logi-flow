import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MainLayout } from '@/components/layout/MainLayout';
import { BulkImportModal } from '@/components/forms/BulkImportModal';
import { 
  Upload, 
  Download, 
  Users, 
  Package, 
  CreditCard, 
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  History,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportHistory {
  id: string;
  import_type: string;
  file_name: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  created_at: string;
  completed_at: string | null;
  status: 'processing' | 'completed' | 'failed';
  error_details: any;
}

interface DataStatistics {
  customers: number;
  products: number;
  movements: number;
  lastImportDate: string | null;
}

export default function BulkImportPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [statistics, setStatistics] = useState<DataStatistics>({
    customers: 0,
    products: 0,
    movements: 0,
    lastImportDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const [customersCount, productsCount, movementsCount] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('customer_movements').select('*', { count: 'exact', head: true })
      ]);

      setStatistics({
        customers: customersCount.count || 0,
        products: productsCount.count || 0,
        movements: movementsCount.count || 0,
        lastImportDate: new Date().toISOString() // Simulated for now
      });

      // Note: Import history would come from a dedicated table in a real implementation
      // For now, we'll simulate some data
      setImportHistory([
        {
          id: '1',
          import_type: 'customers',
          file_name: 'clientes_enero_2024.xlsx',
          total_records: 150,
          successful_records: 147,
          failed_records: 3,
          created_at: '2024-01-15T10:30:00Z',
          completed_at: '2024-01-15T10:32:15Z',
          status: 'completed',
          error_details: null
        },
        {
          id: '2',
          import_type: 'products',
          file_name: 'productos_catalogo.csv',
          total_records: 500,
          successful_records: 500,
          failed_records: 0,
          created_at: '2024-01-10T14:15:00Z',
          completed_at: '2024-01-10T14:17:30Z',
          status: 'completed',
          error_details: null
        }
      ]);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = () => {
    fetchData();
    setShowImportModal(false);
    toast({
      title: 'Importación completada',
      description: 'Los datos se han importado exitosamente'
    });
  };

  const getImportTypeIcon = (type: string) => {
    switch (type) {
      case 'customers': return <Users className="h-4 w-4" />;
      case 'products': return <Package className="h-4 w-4" />;
      case 'movements': return <CreditCard className="h-4 w-4" />;
      default: return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const getImportTypeName = (type: string) => {
    switch (type) {
      case 'customers': return 'Clientes';
      case 'products': return 'Productos';
      case 'movements': return 'Movimientos';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><TrendingUp className="h-3 w-3 mr-1" />Procesando</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center">Cargando información...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Importación Masiva</h1>
            <p className="text-muted-foreground">
              Importa grandes volúmenes de datos desde archivos Excel o CSV
            </p>
          </div>
          <Button onClick={() => setShowImportModal(true)} size="lg">
            <Upload className="h-4 w-4 mr-2" />
            Nueva Importación
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.customers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% desde el último mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.products.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +8% desde el último mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.movements.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +25% desde el último mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Importación</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Hoy</div>
              <p className="text-xs text-muted-foreground">
                147 registros importados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Operaciones comunes de importación de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setShowImportModal(true)}
              >
                <Users className="h-6 w-6" />
                <span>Importar Clientes</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setShowImportModal(true)}
              >
                <Package className="h-6 w-6" />
                <span>Importar Productos</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setShowImportModal(true)}
              >
                <CreditCard className="h-6 w-6" />
                <span>Importar Movimientos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Guías de Importación
            </CardTitle>
            <CardDescription>
              Mejores prácticas para importaciones exitosas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">✓ Recomendaciones</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Usa la plantilla Excel descargada para evitar errores</li>
                  <li>• Verifica que todos los campos requeridos estén completos</li>
                  <li>• Importa lotes de máximo 1,000 registros por vez</li>
                  <li>• Mantén formato consistente en fechas (YYYY-MM-DD)</li>
                  <li>• Revisa la vista previa antes de importar</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-red-600">✗ Errores Comunes</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Campos requeridos vacíos o con espacios</li>
                  <li>• Formatos de email incorrectos</li>
                  <li>• Precios o costos con texto en lugar de números</li>
                  <li>• Fechas en formato incorrecto</li>
                  <li>• Caracteres especiales en códigos de producto</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Historial de Importaciones
            </CardTitle>
            <CardDescription>
              Últimas importaciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Exitosos</TableHead>
                      <TableHead>Fallidos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getImportTypeIcon(item.import_type)}
                            <span>{getImportTypeName(item.import_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.file_name}</TableCell>
                        <TableCell>{item.total_records}</TableCell>
                        <TableCell className="text-green-600">{item.successful_records}</TableCell>
                        <TableCell className="text-red-600">{item.failed_records}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No hay importaciones registradas aún</p>
                <p className="text-sm">Las importaciones aparecerán aquí una vez completadas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Modal */}
        <BulkImportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImportComplete={handleImportComplete}
        />
      </div>
    </MainLayout>
  );
}