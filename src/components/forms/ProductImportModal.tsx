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
  codigo: string;
  descripcion: string;
  anos_garantia?: number;
  meses_garantia?: number;
  costo: number;
  precio_lista_1: number;
  precio_lista_2?: number;
  categoria?: string;
  marca?: string;
  codigo_proveedor?: string;
}

const SAMPLE_DATA: ProductRow[] = [
  {
    codigo: 'EL001',
    descripcion: 'Smartphone Samsung Galaxy A54',
    anos_garantia: 1,
    meses_garantia: 6,
    costo: 25000,
    precio_lista_1: 35000,
    precio_lista_2: 32000,
    categoria: 'Electrónicos',
    marca: 'Samsung',
    codigo_proveedor: 'SAM-A54-128'
  },
  {
    codigo: 'EL002', 
    descripcion: 'Auriculares Bluetooth Sony',
    anos_garantia: 0,
    meses_garantia: 6,
    costo: 5500,
    precio_lista_1: 8500,
    precio_lista_2: 7800,
    categoria: 'Electrónicos',
    marca: 'Sony',
    codigo_proveedor: 'SONY-BT-001'
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
      {wch: 10}, // codigo
      {wch: 30}, // descripcion
      {wch: 12}, // anos_garantia
      {wch: 12}, // meses_garantia
      {wch: 10}, // costo
      {wch: 12}, // precio_lista_1
      {wch: 12}, // precio_lista_2
      {wch: 15}, // categoria
      {wch: 15}, // marca
      {wch: 20}, // codigo_proveedor
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
      if (!row.codigo || row.codigo.toString().trim() === '') {
        errors.push({
          row: index + 1,
          error: 'El código es requerido',
          data: row
        });
      }

      if (!row.descripcion || row.descripcion.toString().trim() === '') {
        errors.push({
          row: index + 1,
          error: 'La descripción es requerida',
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

      if (!row.precio_lista_1 || isNaN(Number(row.precio_lista_1))) {
        errors.push({
          row: index + 1,
          error: 'El precio de lista 1 debe ser un número válido',
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

      if (row.precio_lista_1 && Number(row.precio_lista_1) < 0) {
        errors.push({
          row: index + 1,
          error: 'El precio de lista 1 debe ser mayor o igual a 0',
          data: row
        });
      }

      // Validar garantía
      if (row.anos_garantia && (isNaN(Number(row.anos_garantia)) || Number(row.anos_garantia) < 0)) {
        errors.push({
          row: index + 1,
          error: 'Los años de garantía deben ser un número mayor o igual a 0',
          data: row
        });
      }

      if (row.meses_garantia && (isNaN(Number(row.meses_garantia)) || Number(row.meses_garantia) < 0 || Number(row.meses_garantia) > 11)) {
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
          // Verificar si el código ya existe
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('code', row.codigo)
            .single();

          if (existingProduct) {
            importErrors.push({
              row: i + 1,
              error: `El código "${row.codigo}" ya existe`,
              data: row
            });
            continue;
          }

          // Generar código si está vacío
          let productCode = row.codigo;
          if (!productCode || productCode.trim() === '') {
            productCode = await generateProductCode(row.categoria);
          }

          await supabase.from('products').insert({
            code: productCode,
            name: row.descripcion,
            price: Number(row.precio_lista_1),
            price_list_1: Number(row.precio_lista_1),
            price_list_2: Number(row.precio_lista_2) || 0,
            cost: Number(row.costo),
            category: row.categoria || null,
            brand: row.marca || null,
            warranty_years: Number(row.anos_garantia) || null,
            warranty_months: Number(row.meses_garantia) || null,
            supplier_code: row.codigo_proveedor || null,
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
                    <Badge variant="destructive">1. codigo</Badge>
                    <Badge variant="destructive">2. descripcion</Badge>
                    <Badge variant="secondary">3. anos_garantia</Badge>
                    <Badge variant="secondary">4. meses_garantia</Badge>
                    <Badge variant="destructive">5. costo</Badge>
                    <Badge variant="destructive">6. precio_lista_1</Badge>
                    <Badge variant="secondary">7. precio_lista_2</Badge>
                    <Badge variant="secondary">8. categoria</Badge>
                    <Badge variant="secondary">9. marca</Badge>
                    <Badge variant="secondary">10. codigo_proveedor</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Los campos en rojo son obligatorios, los campos en gris son opcionales.
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
                            <th className="border border-border p-2 text-left">Código</th>
                            <th className="border border-border p-2 text-left">Descripción</th>
                            <th className="border border-border p-2 text-left">Costo</th>
                            <th className="border border-border p-2 text-left">Precio Lista 1</th>
                            <th className="border border-border p-2 text-left">Garantía</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 3).map((row, index) => (
                            <tr key={index}>
                              <td className="border border-border p-2">{row.codigo}</td>
                              <td className="border border-border p-2">{row.descripcion}</td>
                              <td className="border border-border p-2">${row.costo}</td>
                              <td className="border border-border p-2">${row.precio_lista_1}</td>
                              <td className="border border-border p-2">
                                {row.anos_garantia || 0}a {row.meses_garantia || 0}m
                              </td>
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