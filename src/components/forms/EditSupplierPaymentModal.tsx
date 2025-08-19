import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const formSchema = z.object({
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_date: z.date(),
  due_date: z.date(),
  payment_method: z.string().min(1, 'Selecciona un método de pago'),
  payment_status: z.string(),
  is_check: z.boolean(),
  check_number: z.string().optional(),
  check_due_date: z.date().optional(),
  notes: z.string().optional(),
  receipt_file: z.any().optional(),
  check_file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SupplierPayment {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  payment_method: string;
  payment_status: string;
  is_check: boolean;
  check_number?: string;
  check_due_date?: string;
  notes?: string;
  receipt_url?: string;
  check_image_url?: string;
}

interface EditSupplierPaymentModalProps {
  payment: SupplierPayment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSupplierPaymentModal({
  payment,
  isOpen,
  onClose,
  onSuccess,
}: EditSupplierPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [checkFile, setCheckFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: payment.amount,
      payment_date: new Date(payment.payment_date),
      due_date: new Date(payment.due_date),
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      is_check: payment.is_check,
      check_number: payment.check_number || '',
      check_due_date: payment.check_due_date ? new Date(payment.check_due_date) : undefined,
      notes: payment.notes || '',
    },
  });

  const isCheckPayment = form.watch('is_check');
  const paymentStatus = form.watch('payment_status');

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      let receiptUrl = payment.receipt_url;
      let checkImageUrl = payment.check_image_url;

      // Upload receipt file if provided
      if (receiptFile) {
        const receiptPath = `receipts/${payment.id}_${Date.now()}_${receiptFile.name}`;
        receiptUrl = await uploadFile(receiptFile, 'media', receiptPath);
      }

      // Upload check file if provided
      if (checkFile) {
        const checkPath = `checks/${payment.id}_${Date.now()}_${checkFile.name}`;
        checkImageUrl = await uploadFile(checkFile, 'media', checkPath);
      }

      const updateData: any = {
        amount: values.amount,
        payment_date: values.payment_date.toISOString().split('T')[0],
        due_date: values.due_date.toISOString().split('T')[0],
        payment_method: values.payment_method,
        payment_status: values.payment_status,
        is_check: values.is_check,
        check_number: values.check_number,
        check_due_date: values.check_due_date?.toISOString().split('T')[0],
        notes: values.notes,
        receipt_url: receiptUrl,
        check_image_url: checkImageUrl,
      };

      // Set paid_at timestamp when marking as paid
      if (values.payment_status === 'pagado' && payment.payment_status !== 'pagado') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('supplier_payments')
        .update(updateData)
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Pago actualizado correctamente',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el pago',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pago a Proveedor</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="pagado">Pagado</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_check"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Es un cheque</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {isCheckPayment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="check_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Cheque</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="check_due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Cobro del Cheque</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {paymentStatus === 'pagado' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Comprobante de Pago</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                      <Upload className="h-4 w-4" />
                    </div>
                    {payment.receipt_url && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Ver comprobante actual
                        </a>
                      </p>
                    )}
                  </div>

                  {isCheckPayment && (
                    <div>
                      <FormLabel>Imagen del Cheque</FormLabel>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCheckFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="h-4 w-4" />
                      </div>
                      {payment.check_image_url && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <a href={payment.check_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Ver imagen actual
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Actualizar Pago'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}