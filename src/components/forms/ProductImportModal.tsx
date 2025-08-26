import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ProductImportModalProps {
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

interface ProductRow {
  nombre: string;
  lista_general: number;
  lista_credito: number;
  garantia_anos: number;
  garantia_meses: number;
  codigo_proveedor: string;
  costo: number;
  categoria?: string;
  marca?: string;
}

const SAMPLE_DATA: ProductRow[] = [
  {
    nombre: 'Smartphone Samsung Galaxy A54',
    lista_general: 35000,
    lista_credito: 32000,
    garantia_anos: 1,
    garantia_meses: 6,
    codigo_proveedor: 'SAM-A54-128',
    costo: 25000,
    categoria: 'Electrónicos',
    marca: 'Samsung'
  },
  {
    nombre: 'Auriculares Bluetooth Sony',
    lista_general: 8500,
    lista_credito: 7800,
    garantia_anos: 0,
    garantia_meses: 6,
    codigo_proveedor: 'SONY-BT-001',
    costo: 5500,
    categoria: 'Electrónicos',
    marca: 'Sony'
  }
];

export function ProductImportModal({ open, onOpenChange, onImportComplete }: ProductImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsedData, setParsedData] = useState<ProductRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_DATA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    // Set column widths
    const wscols = [
      {wch: 30}, // nombre
      {wch: 12}, // lista_general
      {wch: 12}, // lista_credito
      {wch: 12}, // garantia_anos
      {wch: 12}, // garantia_meses
      {wch: 20}, // codigo_proveedor
      {wch: 10}, // costo
      {wch: 15}, // categoria
      {wch: 15}, // marca
    ];
    ws['!cols'] = wscols;
    
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
    
    toast({
      title: "Plantilla descargada",
      description: "Se descargó la plantilla de ejemplo con el formato correcto"
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Tipo de archivo no válido',
        description: 'Por favor, selecciona un archivo Excel (.xlsx)',
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
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as ProductRow[];

      setParsedData(data);
      toast({
        title: 'Archivo procesado exitosamente',
        description: `Se encontraron ${data.length} productos para importar`
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

  const validateData = (data: ProductRow[]) => {
    const errors: Array<{ row: number; error: string; data: any }> = [];

    data.forEach((row, index) => {
      // Validar campos requeridos
      if (!row.nombre || row.nombre.toString().trim() === '') {
        errors.push({
          row: index + 1,
          error: 'El nombre es requerido',
          data: row
        });
      }

      if (!row.lista_general || isNaN(Number(row.lista_general))) {
        errors.push({
          row: index + 1,
          error: 'La lista general debe ser un número válido',
          data: row
        });
      }

      if (!row.lista_credito || isNaN(Number(row.lista_credito))) {
        errors.push({
          row: index + 1,
          error: 'La lista crédito debe ser un número válido',
          data: row
        });
      }

      if (row.garantia_anos === undefined || row.garantia_anos === null || isNaN(Number(row.garantia_anos))) {
        errors.push({
          row: index + 1,
          error: 'Los años de garantía son requeridos y deben ser un número',
          data: row
        });
      }

      if (row.garantia_meses === undefined || row.garantia_meses === null || isNaN(Number(row.garantia_meses))) {
        errors.push({
          row: index + 1,
          error: 'Los meses de garantía son requeridos y deben ser un número',
          data: row
        });
      }

      if (!row.codigo_proveedor || row.codigo_proveedor.toString().trim() === '') {
        errors.push({
          row: index + 1,
          error: 'El código proveedor es requerido',
          data: row
        });
      }

      if (!row.costo || isNaN(Number(row.costo))) {
        errors.push({
          row: index + 1,
          error: 'El costo debe ser un número válido',
          data: row
        });
      }

      // Validar números positivos
      if (row.costo && Number(row.costo) < 0) {
        errors.push({
          row: index + 1,
          error: 'El costo debe ser mayor o igual a 0',
          data: row
        });
      }

      if (row.lista_general && Number(row.lista_general) < 0) {
        errors.push({
          row: index + 1,
          error: 'La lista general debe ser mayor o igual a 0',
          data: row
        });
      }

      if (row.lista_credito && Number(row.lista_credito) < 0) {
        errors.push({
          row: index + 1,
          error: 'La lista crédito debe ser mayor o igual a 0',
          data: row
        });
      }

      // Validar garantía
      if (row.garantia_anos !== undefined && (Number(row.garantia_anos) < 0)) {
        errors.push({
          row: index + 1,
          error: 'Los años de garantía deben ser mayor o igual a 0',
          data: row
        });
      }

      if (row.garantia_meses !== undefined && (Number(row.garantia_meses) < 0 || Number(row.garantia_meses) > 11)) {
        errors.push({
          row: index + 1,
          error: 'Los meses de garantía deben ser un número entre 0 y 11',
          data: row
        });
      }
    });

    return errors;
  };

  const generateProductCode = async (categoryName?: string): Promise<string> => {
    if (!categoryName || categoryName === "none") {
      return "GE001"; // Código genérico si no hay categoría
    }

    // Obtener las primeras 2 letras de la categoría
    const categoryPrefix = categoryName.substring(0, 2).toUpperCase();

    // Buscar el último código usado para esta categoría
    const { data: existingProducts, error } = await supabase
      .from("products")
      .select("code")
      .like("code", `${categoryPrefix}%`)
      .order("code", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching existing codes:", error);
      return `${categoryPrefix}001`;
    }

    if (!existingProducts || existingProducts.length === 0) {
      return `${categoryPrefix}001`;
    }

    // Extraer el número del último código
    const lastCode = existingProducts[0].code;
    const numberPart = lastCode.substring(2);
    const nextNumber = parseInt(numberPart) + 1;

    // Formatear con ceros a la izquierda (3 dígitos)
    return `${categoryPrefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  const importData = async () => {
    if (!parsedData.length) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    const errors = validateData(parsedData);
    const validData = parsedData.filter((_, index) => 
      !errors.some(error => error.row === index + 1)
    );

    let successful = 0;
    const importErrors: Array<{ row: number; error: string; data: any }> = [...errors];

    try {
      for (let i = 0; i < validData.length; i++) {
        const row = validData[i];
        
        try {
          // Generar código automáticamente basado en la categoría
          const productCode = await generateProductCode(row.categoria);

          await supabase.from('products').insert({
            code: productCode,
            name: row.nombre,
            price: Number(row.lista_general),
            price_list_1: Number(row.lista_general),
            price_list_2: Number(row.lista_credito),
            cost: Number(row.costo),
            category: row.categoria || null,
            brand: row.marca || null,
            warranty_years: Number(row.garantia_anos),
            warranty_months: Number(row.garantia_meses),
            supplier_code: row.codigo_proveedor,
            is_active: true,
            use_automatic_pricing: false,
            has_variants: false
          });

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
          description: `Se importaron ${successful} de ${parsedData.length} productos exitosamente`
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
          <DialogTitle>Importar Productos desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle>Formato de Excel Requerido</CardTitle>
              <CardDescription>
                Descarga la plantilla con el formato correcto para importar productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Columnas requeridas (en este orden):</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="destructive">1. nombre</Badge>
                    <Badge variant="destructive">2. lista_general</Badge>
                    <Badge variant="destructive">3. lista_credito</Badge>
                    <Badge variant="destructive">4. garantia_anos</Badge>
                    <Badge variant="destructive">5. garantia_meses</Badge>
                    <Badge variant="destructive">6. codigo_proveedor</Badge>
                    <Badge variant="destructive">7. costo</Badge>
                    <Badge variant="secondary">8. categoria</Badge>
                    <Badge variant="secondary">9. marca</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Los campos en rojo son obligatorios, los campos en gris son opcionales. El código del producto se genera automáticamente.
                  </p>
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
              <CardTitle>Subir Archivo Excel</CardTitle>
              <CardDescription>
                Selecciona tu archivo Excel (.xlsx) con los productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  {file ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-primary" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedData.length} productos encontrados
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
                        Seleccionar Archivo Excel
                      </Button>
                    </div>
                  )}
                </div>

                {parsedData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Vista previa (primeros 3 productos)
                      </span>
                      <Badge variant="outline">{parsedData.length} total</Badge>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse border border-border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border border-border p-2 text-left">Nombre</th>
                            <th className="border border-border p-2 text-left">Lista General</th>
                            <th className="border border-border p-2 text-left">Lista Crédito</th>
                            <th className="border border-border p-2 text-left">Garantía</th>
                            <th className="border border-border p-2 text-left">Código Proveedor</th>
                            <th className="border border-border p-2 text-left">Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 3).map((row, index) => (
                            <tr key={index}>
                              <td className="border border-border p-2">{row.nombre}</td>
                              <td className="border border-border p-2">${row.lista_general}</td>
                              <td className="border border-border p-2">${row.lista_credito}</td>
                              <td className="border border-border p-2">
                                {row.garantia_anos || 0}a {row.garantia_meses || 0}m
                              </td>
                              <td className="border border-border p-2">{row.codigo_proveedor}</td>
                              <td className="border border-border p-2">${row.costo}</td>
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
                      <span>Importando productos...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                        <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                        <p className="text-sm">Exitosos</p>
                      </div>
                      <div className="text-center">
                        <XCircle className="h-8 w-8 mx-auto text-red-500" />
                        <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                        <p className="text-sm">Fallidos</p>
                      </div>
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-blue-500" />
                        <p className="text-2xl font-bold text-blue-600">{result.total}</p>
                        <p className="text-sm">Total</p>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Errores encontrados:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {result.errors.map((error, index) => (
                            <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                              <span className="font-medium">Fila {error.row}:</span> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Button 
                      onClick={importData}
                      className="w-full"
                      size="lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar {parsedData.length} Productos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}