import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

const IMPORT_TYPES = {
  customers: {
    name: 'Clientes',
    requiredFields: ['name', 'address', 'city'],
    optionalFields: ['email', 'phone', 'neighborhood', 'departamento', 'cedula_identidad', 'margen', 'notes'],
    template: [
      { name: 'Juan Pérez', email: 'juan@email.com', phone: '099123456', address: 'Av. 18 de Julio 1234', neighborhood: 'Centro', city: 'Montevideo', departamento: 'Montevideo', cedula_identidad: '12345678', margen: 15, notes: 'Cliente VIP' }
    ]
  },
  products: {
    name: 'Productos',
    requiredFields: ['code', 'name', 'price', 'cost'],
    optionalFields: ['category', 'brand', 'margin_percentage'],
    template: [
      { code: 'PROD001', name: 'Producto Ejemplo', category: 'Electrónicos', brand: 'Samsung', price: 100, cost: 60, margin_percentage: 40 }
    ]
  },
  movements: {
    name: 'Movimientos de Cliente',
    requiredFields: ['customer_name', 'movement_date', 'balance_amount'],
    optionalFields: ['payment_info'],
    template: [
      { customer_name: 'Juan Pérez', movement_date: '2024-01-15', balance_amount: 500, payment_info: 'Pago efectivo' }
    ]
  }
};

export function BulkImportModal({ open, onOpenChange, onImportComplete }: BulkImportModalProps) {
  const [selectedType, setSelectedType] = useState<keyof typeof IMPORT_TYPES>('customers');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Tipo de archivo no válido',
        description: 'Por favor, selecciona un archivo Excel (.xlsx) o CSV (.csv)',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      let data: any[] = [];

      if (file.type.includes('csv')) {
        const text = new TextDecoder().decode(buffer);
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      } else {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      setParsedData(data);
      toast({
        title: 'Archivo parseado exitosamente',
        description: `Se encontraron ${data.length} registros para importar`
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error al procesar archivo',
        description: 'No se pudo procesar el archivo. Verifica el formato.',
        variant: 'destructive'
      });
    }
  };

  const validateData = (data: any[], type: keyof typeof IMPORT_TYPES) => {
    const config = IMPORT_TYPES[type];
    const errors: Array<{ row: number; error: string; data: any }> = [];

    data.forEach((row, index) => {
      const missingFields = config.requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
      
      if (missingFields.length > 0) {
        errors.push({
          row: index + 1,
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
          data: row
        });
      }

      // Validaciones específicas por tipo
      if (type === 'customers') {
        if (row.email && !row.email.includes('@')) {
          errors.push({
            row: index + 1,
            error: 'Email inválido',
            data: row
          });
        }
      } else if (type === 'products') {
        if (row.price && isNaN(Number(row.price))) {
          errors.push({
            row: index + 1,
            error: 'Precio debe ser un número',
            data: row
          });
        }
        if (row.cost && isNaN(Number(row.cost))) {
          errors.push({
            row: index + 1,
            error: 'Costo debe ser un número',
            data: row
          });
        }
      } else if (type === 'movements') {
        if (row.balance_amount && isNaN(Number(row.balance_amount))) {
          errors.push({
            row: index + 1,
            error: 'Monto debe ser un número',
            data: row
          });
        }
      }
    });

    return errors;
  };

  const importData = async () => {
    if (!parsedData.length) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    const errors = validateData(parsedData, selectedType);
    const validData = parsedData.filter((_, index) => 
      !errors.some(error => error.row === index + 1)
    );

    let successful = 0;
    const importErrors: Array<{ row: number; error: string; data: any }> = [...errors];

    try {
      for (let i = 0; i < validData.length; i++) {
        const row = validData[i];
        
        try {
          if (selectedType === 'customers') {
            await supabase.from('customers').insert({
              name: row.name,
              email: row.email || null,
              phone: row.phone || null,
              address: row.address,
              neighborhood: row.neighborhood || null,
              city: row.city,
              departamento: row.departamento || null,
              cedula_identidad: row.cedula_identidad || null,
              margen: row.margen ? Number(row.margen) : null,
              notes: row.notes || null
            });
          } else if (selectedType === 'products') {
            await supabase.from('products').insert({
              code: row.code,
              name: row.name,
              category: row.category || null,
              brand: row.brand || null,
              price: Number(row.price),
              cost: Number(row.cost),
              margin_percentage: row.margin_percentage ? Number(row.margin_percentage) : null
            });
          } else if (selectedType === 'movements') {
            // Buscar customer por nombre
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('name', row.customer_name)
              .single();

            if (!customer) {
              importErrors.push({
                row: i + 1,
                error: `Cliente "${row.customer_name}" no encontrado`,
                data: row
              });
              continue;
            }

            await supabase.from('customer_movements').insert({
              customer_id: customer.id,
              movement_date: row.movement_date,
              balance_amount: Number(row.balance_amount),
              payment_info: row.payment_info || null
            });
          }

          successful++;
        } catch (error: any) {
          importErrors.push({
            row: i + 1,
            error: error.message || 'Error desconocido',
            data: row
          });
        }

        setProgress(((i + 1) / validData.length) * 100);
      }

      const finalResult: ImportResult = {
        total: parsedData.length,
        successful,
        failed: parsedData.length - successful,
        errors: importErrors
      };

      setResult(finalResult);

      if (successful > 0) {
        toast({
          title: 'Importación completada',
          description: `Se importaron ${successful} de ${parsedData.length} registros exitosamente`
        });
        onImportComplete?.();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Error en la importación',
        description: 'Ocurrió un error durante la importación',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const config = IMPORT_TYPES[selectedType];
    const ws = XLSX.utils.json_to_sheet(config.template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_${selectedType}.xlsx`);
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetModal();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importación Masiva de Datos</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Importar Datos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            {/* Selector de tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Tipo de Datos</CardTitle>
                <CardDescription>
                  Elige qué tipo de datos deseas importar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(IMPORT_TYPES).map(([key, config]) => (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-colors ${
                        selectedType === key ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedType(key as keyof typeof IMPORT_TYPES)}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {config.requiredFields.length} campos requeridos
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Template */}
            <Card>
              <CardHeader>
                <CardTitle>Plantilla</CardTitle>
                <CardDescription>
                  Descarga la plantilla con el formato correcto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Campos Requeridos:</h5>
                    <div className="flex flex-wrap gap-2">
                      {IMPORT_TYPES[selectedType].requiredFields.map(field => (
                        <Badge key={field} variant="destructive">{field}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Campos Opcionales:</h5>
                    <div className="flex flex-wrap gap-2">
                      {IMPORT_TYPES[selectedType].optionalFields.map(field => (
                        <Badge key={field} variant="secondary">{field}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Plantilla Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subir archivo */}
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo</CardTitle>
                <CardDescription>
                  Selecciona tu archivo Excel (.xlsx) o CSV (.csv)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    {file ? (
                      <div className="space-y-2">
                        <FileText className="h-8 w-8 mx-auto text-primary" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {parsedData.length} registros encontrados
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Cambiar Archivo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Seleccionar Archivo
                        </Button>
                      </div>
                    )}
                  </div>

                  {parsedData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Vista previa (primeros 3 registros)
                        </span>
                        <Badge variant="outline">{parsedData.length} total</Badge>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-border">
                          <thead>
                            <tr className="bg-muted">
                              {Object.keys(parsedData[0] || {}).map(key => (
                                <th key={key} className="border border-border p-2 text-left">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.slice(0, 3).map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="border border-border p-2">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Importar */}
            {parsedData.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  {importing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Importando datos...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  ) : (
                    <Button onClick={importData} className="w-full" size="lg">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar {parsedData.length} Registros
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results">
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{result.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                      <div className="text-sm text-muted-foreground">Exitosos</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                      <div className="text-sm text-muted-foreground">Fallidos</div>
                    </CardContent>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                        Errores de Importación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <div key={index} className="p-3 border border-red-200 rounded bg-red-50">
                            <div className="font-medium text-red-800">
                              Fila {error.row}: {error.error}
                            </div>
                            <div className="text-sm text-red-600 mt-1">
                              Datos: {JSON.stringify(error.data, null, 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay resultados de importación aún.
                Completa una importación para ver los resultados aquí.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}