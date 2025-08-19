import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const checkSchema = z.object({
  check_number: z.string().min(1, 'Número de cheque requerido'),
  check_due_date: z.date(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
});

const formSchema = z.object({
  purchase_id: z.string().min(1, 'Selecciona una compra'),
  supplier_id: z.string().min(1, 'Selecciona un proveedor'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_date: z.date(),
  due_date: z.date(),
  payment_method: z.string().min(1, 'Selecciona un método de pago'),
  is_check: z.boolean().default(false),
  checks: z.array(checkSchema).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateSupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSupplierPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSupplierPaymentModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_date: new Date(),
      due_date: new Date(),
      payment_method: 'efectivo',
      is_check: false,
      checks: [],
    },
  });

  const { fields: checkFields, append: appendCheck, remove: removeCheck } = useFieldArray({
    control: form.control,
    name: 'checks',
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases-for-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchase_number,
          total_amount,
          supplier_id,
          suppliers (name)
        `)
        .eq('status', 'pendiente')
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const isCheckPayment = form.watch('is_check');
  const selectedPurchase = purchases.find(p => p.id === form.watch('purchase_id'));

  const addCheck = () => {
    appendCheck({
      check_number: '',
      check_due_date: new Date(),
      amount: 0,
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Set payment status based on payment method
      const paymentStatus = values.payment_method === 'efectivo' ? 'pagado' : 'pendiente';
      
      const insertData = {
        purchase_id: values.purchase_id,
        supplier_id: values.supplier_id,
        amount: values.amount,
        payment_date: values.payment_date.toISOString().split('T')[0],
        due_date: values.due_date.toISOString().split('T')[0],
        payment_method: values.payment_method,
        is_check: values.is_check,
        notes: values.notes,
        created_by: user.id,
        payment_status: paymentStatus,
        paid_at: paymentStatus === 'pagado' ? new Date().toISOString() : null,
      };

      const { data: paymentData, error } = await supabase
        .from('supplier_payments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Insert checks if any
      if (values.is_check && values.checks && values.checks.length > 0) {
        const checksToInsert = values.checks.map(check => ({
          supplier_payment_id: paymentData.id,
          check_number: check.check_number,
          check_due_date: check.check_due_date.toISOString().split('T')[0],
          amount: check.amount,
        }));

        const { error: checksError } = await supabase
          .from('supplier_payment_checks')
          .insert(checksToInsert);

        if (checksError) throw checksError;
      }

      toast({
        title: 'Éxito',
        description: 'Pago a proveedor creado correctamente',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el pago',
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
          <DialogTitle>Nuevo Pago a Proveedor</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compra</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const purchase = purchases.find(p => p.id === value);
                        if (purchase) {
                          form.setValue('supplier_id', purchase.supplier_id);
                          form.setValue('amount', purchase.total_amount);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una compra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purchases.map((purchase) => (
                          <SelectItem key={purchase.id} value={purchase.id}>
                            {purchase.purchase_number} - {purchase.suppliers.name} - ${purchase.total_amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Pago</FormLabel>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Vencimiento</FormLabel>
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

            {isCheckPayment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Cheques</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCheck}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Cheque
                  </Button>
                </div>

                {checkFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">Cheque #{index + 1}</h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCheck(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`checks.${index}.check_number`}
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
                        name={`checks.${index}.amount`}
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
                        name={`checks.${index}.check_due_date`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Cobro</FormLabel>
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
                  </div>
                ))}

                {checkFields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay cheques agregados</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCheck}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Primer Cheque
                    </Button>
                  </div>
                )}
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
                {isSubmitting ? 'Guardando...' : 'Crear Pago'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}