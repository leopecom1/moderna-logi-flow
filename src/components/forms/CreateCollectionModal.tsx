import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign } from "lucide-react";

const formSchema = z.object({
  customer_id: z.string().min(1, "Cliente es requerido"),
  sale_id: z.string().optional(),
  order_id: z.string().optional(),
  collection_date: z.string().min(1, "Fecha de cobro es requerida"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  payment_method_type: z.enum([
    "efectivo", "transferencia", "mercado_pago", "tarjeta_credito", 
    "tarjeta_debito", "cheque", "otros"
  ]),
  payment_reference: z.string().optional(),
  bank_name: z.string().optional(),
  account_info: z.string().optional(),
  collection_status: z.enum(["pendiente", "confirmado", "rechazado", "reversado"]),
  notes: z.string().optional(),
  receipt_number: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCollectionModalProps {
  onCollectionCreated?: () => void;
  customerId?: string;
  saleId?: string;
  orderId?: string;
}

export function CreateCollectionModal({ 
  onCollectionCreated, 
  customerId, 
  saleId, 
  orderId 
}: CreateCollectionModalProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: customerId || "",
      sale_id: saleId || "",
      order_id: orderId || "",
      collection_date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_method_type: "efectivo",
      payment_reference: "",
      bank_name: "",
      account_info: "",
      collection_status: "confirmado",
      notes: "",
      receipt_number: "",
    },
  });

  // Cargar datos necesarios
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [customersResult, ordersResult] = await Promise.all([
          supabase.from("customers").select("id, name"),
          supabase.from("orders").select("id, order_number, total_amount, customer:customers(name)"),
        ]);

        if (customersResult.data) setCustomers(customersResult.data);
        if (ordersResult.data) setOrders(ordersResult.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!user) throw new Error("Usuario no autenticado");

      const collectionData = {
        customer_id: values.customer_id,
        sale_id: values.sale_id === 'none' ? null : values.sale_id || null,
        order_id: values.order_id === 'none' ? null : values.order_id || null,
        collector_id: user.id,
        collection_date: values.collection_date,
        amount: values.amount,
        payment_method_type: values.payment_method_type,
        payment_reference: values.payment_reference || null,
        bank_name: values.bank_name || null,
        account_info: values.account_info || null,
        collection_status: values.collection_status,
        notes: values.notes || null,
        receipt_number: values.receipt_number || null,
      };

      const { error } = await supabase
        .from("collections")
        .insert([collectionData]);

      if (error) throw error;

      toast({
        title: "Cobro registrado",
        description: "El cobro ha sido registrado exitosamente.",
      });

      form.reset({
        customer_id: customerId || "",
        sale_id: saleId || "",
        order_id: orderId || "",
        collection_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method_type: "efectivo",
        payment_reference: "",
        bank_name: "",
        account_info: "",
        collection_status: "confirmado",
        notes: "",
        receipt_number: "",
      });
      setOpen(false);
      onCollectionCreated?.();
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el cobro.",
        variant: "destructive",
      });
    }
  };

  const paymentMethodLabels = {
    efectivo: "Efectivo",
    transferencia: "Transferencia Bancaria",
    mercado_pago: "Mercado Pago",
    tarjeta_credito: "Tarjeta de Crédito",
    tarjeta_debito: "Tarjeta de Débito",
    cheque: "Cheque",
    otros: "Otros",
  };

  const statusLabels = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    rechazado: "Rechazado",
    reversado: "Reversado",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Registrar Cobro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Cobro</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!customerId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
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
                name="collection_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Cobro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar orden" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin orden específica</SelectItem>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            #{order.order_number} - ${order.total_amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(paymentMethodLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia/ID Transacción</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: MP123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receipt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Recibo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: REC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Banco Santander" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collection_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="account_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Información de Cuenta</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de cuenta, CBU, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Cobro</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}