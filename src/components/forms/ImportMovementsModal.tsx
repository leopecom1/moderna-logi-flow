import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { read, utils } from 'xlsx';

interface ImportMovementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onImportComplete: () => void;
}

interface MovementData {
  date: string;
  delivery: string;
  balance: number;
}

interface CustomerFromExcel {
  name: string;
  cedula: string;
  phone: string;
  address: string;
  margen: number;
  movements: MovementData[];
}

export const ImportMovementsModal = ({ open, onOpenChange, customerId, onImportComplete }: ImportMovementsModalProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CustomerFromExcel | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      setLoading(true);
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      if (!worksheet) {
        throw new Error('No se encontró la hoja de cálculo');
      }

      // Extract customer info from specific cells
      const customerName = worksheet['A1']?.v || '';
      const cedula = worksheet['A2']?.v || '';
      const phone = worksheet['B2']?.v || '';
      const address = worksheet['A3']?.v || '';
      const margen = Number(worksheet['E2']?.v) || 0;

      // Extract movements from A5:C200
      const movements: MovementData[] = [];
      
      for (let row = 5; row <= 200; row++) {
        const dateCell = worksheet[`A${row}`];
        const deliveryCell = worksheet[`B${row}`];
        const balanceCell = worksheet[`C${row}`];
        
        if (dateCell?.v) {
          const date = dateCell.v;
          const delivery = deliveryCell?.v || '';
          const balance = Number(balanceCell?.v) || 0;
          
          // Convert Excel date to proper format if needed
          let formattedDate: string;
          if (typeof date === 'number') {
            // Excel date number to JavaScript date
            const excelDate = new Date((date - 25569) * 86400 * 1000);
            formattedDate = excelDate.toISOString().split('T')[0];
          } else if (typeof date === 'string') {
            formattedDate = date;
          } else if (date instanceof Date) {
            formattedDate = date.toISOString().split('T')[0];
          } else {
            continue; // Skip invalid dates
          }
          
          movements.push({
            date: formattedDate,
            delivery: String(delivery),
            balance: balance
          });
        }
      }

      const customerData: CustomerFromExcel = {
        name: String(customerName),
        cedula: String(cedula),
        phone: String(phone),
        address: String(address),
        margen: margen,
        movements: movements
      };

      setPreviewData(customerData);
      
      toast({
        title: 'Archivo procesado',
        description: `Se encontraron ${movements.length} movimientos para ${customerName}`,
      });
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar el archivo Excel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || !profile?.id) return;

    try {
      setLoading(true);

      // Update customer information
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: previewData.name,
          cedula_identidad: previewData.cedula,
          phone: previewData.phone,
          address: previewData.address,
          margen: previewData.margen,
        })
        .eq('id', customerId);

      if (customerError) throw customerError;

      // Delete existing movements for this customer
      const { error: deleteError } = await supabase
        .from('customer_movements')
        .delete()
        .eq('customer_id', customerId);

      if (deleteError) throw deleteError;

      // Insert new movements
      const movementsToInsert = previewData.movements.map(movement => ({
        customer_id: customerId,
        movement_date: movement.date,
        delivery_info: movement.delivery,
        balance_amount: movement.balance,
      }));

      if (movementsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('customer_movements')
          .insert(movementsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Importación exitosa',
        description: `Se importaron ${previewData.movements.length} movimientos correctamente`,
      });

      onImportComplete();
      onOpenChange(false);
      setFile(null);
      setPreviewData(null);

    } catch (error) {
      console.error('Error importing movements:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron importar los movimientos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Importar Movimientos desde Excel</span>
          </DialogTitle>
          <DialogDescription>
            Carga un archivo Excel con los movimientos del cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Archivo Excel</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {/* Format Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Formato del Excel:
            </h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>A1:</strong> Nombre del cliente</li>
              <li>• <strong>A2:</strong> Cédula, <strong>B2:</strong> Teléfono</li>
              <li>• <strong>A3:</strong> Dirección</li>
              <li>• <strong>E2:</strong> Margen</li>
              <li>• <strong>A5:A200:</strong> Fechas</li>
              <li>• <strong>B5:B200:</strong> Información de entrega</li>
              <li>• <strong>C5:C200:</strong> Saldos</li>
            </ul>
          </div>

          {/* Preview */}
          {previewData && (
            <div className="space-y-4">
              <h4 className="font-medium">Vista previa:</h4>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Cliente:</strong> {previewData.name}</div>
                  <div><strong>Cédula:</strong> {previewData.cedula}</div>
                  <div><strong>Teléfono:</strong> {previewData.phone}</div>
                  <div><strong>Margen:</strong> {previewData.margen}%</div>
                  <div className="col-span-2"><strong>Dirección:</strong> {previewData.address}</div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h5 className="font-medium mb-2">Movimientos encontrados: {previewData.movements.length}</h5>
                {previewData.movements.slice(0, 5).map((movement, index) => (
                  <div key={index} className="text-sm grid grid-cols-3 gap-2 py-1">
                    <span>{movement.date}</span>
                    <span>{movement.delivery || 'Sin info'}</span>
                    <span>${movement.balance.toFixed(2)}</span>
                  </div>
                ))}
                {previewData.movements.length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    ... y {previewData.movements.length - 5} más
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleImport}
              disabled={loading || !previewData}
            >
              {loading ? 'Importando...' : 'Importar Movimientos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};