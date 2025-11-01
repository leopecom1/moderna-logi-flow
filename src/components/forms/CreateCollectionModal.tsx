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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, CreditCard, ChevronDown, ChevronRight, Merge } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formSchema = z.object({
  customer_id: z.string().min(1, "Cliente es requerido"),
  collection_type: z.enum(["orden", "credito_moderna", "pago_cuenta"]),
  sale_id: z.string().optional(),
  order_id: z.string().optional(),
  collection_date: z.string().min(1, "Fecha de cobro es requerida"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  payment_method_type: z.enum([
    "efectivo", "transferencia", "mercado_pago", "tarjeta_credito", 
    "tarjeta_debito", "credito_moderna", "cheque", "otros"
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

interface CreditInstallment {
  id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  paid_at?: string;
  paid_amount?: number;
  notes?: string;
  order_id?: string;
  unified_installment_id?: string;
  is_unified_source?: boolean;
}

interface OrderInfo {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
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
  const [creditInstallments, setCreditInstallments] = React.useState<CreditInstallment[]>([]);
  const [unifiedInstallments, setUnifiedInstallments] = React.useState<CreditInstallment[]>([]);
  const [orderInfos, setOrderInfos] = React.useState<Record<string, OrderInfo>>({});
  const [selectedInstallments, setSelectedInstallments] = React.useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = React.useState<Record<string, boolean>>({});
  const [expandedUnified, setExpandedUnified] = React.useState<Record<string, boolean>>({});
  const [collectionType, setCollectionType] = React.useState<string>("pago_cuenta");
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: customerId || "",
      collection_type: "pago_cuenta",
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

        // Si hay customerId, cargar cuotas de crédito
        if (customerId) {
          await loadCreditInstallments(customerId);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open, customerId]);

  const loadCreditInstallments = async (custId: string) => {
    try {
      // Fetch regular installments
      const { data: regularData, error: regularError } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", custId)
        .eq("status", "pendiente")
        .or("is_unified_source.is.null,is_unified_source.eq.false")
        .not("order_id", "is", null)
        .order("due_date", { ascending: true });

      // Fetch unified installments
      const { data: unifiedData, error: unifiedError } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", custId)
        .eq("status", "pendiente")
        .is("order_id", null)
        .eq("is_unified_source", false)
        .order("due_date", { ascending: true });

      if (regularError) throw regularError;
      if (unifiedError) throw unifiedError;

      const regularInstallments = (regularData || []) as CreditInstallment[];
      const unifiedInstallmentsData = (unifiedData || []) as CreditInstallment[];

      setCreditInstallments(regularInstallments);
      setUnifiedInstallments(unifiedInstallmentsData);

      // Fetch order details
      const orderIds = [...new Set(regularInstallments.map(i => i.order_id).filter(Boolean))] as string[];
      if (orderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id, order_number, created_at, total_amount")
          .in("id", orderIds);

        if (!ordersError && ordersData) {
          const ordersMap: Record<string, OrderInfo> = {};
          ordersData.forEach(order => {
            ordersMap[order.id] = order;
          });
          setOrderInfos(ordersMap);
        }
      }
    } catch (error) {
      console.error("Error loading credit installments:", error);
    }
  };

  const toggleInstallmentSelection = (installmentId: string, amount: number) => {
    const newSelected = new Set(selectedInstallments);
    if (newSelected.has(installmentId)) {
      newSelected.delete(installmentId);
    } else {
      newSelected.add(installmentId);
    }
    setSelectedInstallments(newSelected);

    // Calculate total amount
    const allInstallments = [...creditInstallments, ...unifiedInstallments];
    const total = allInstallments
      .filter(inst => newSelected.has(inst.id))
      .reduce((sum, inst) => sum + inst.amount, 0);
    
    form.setValue("amount", total);
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'pagado') return 'bg-green-500';
    if (status === 'vencido' || (status === 'pendiente' && dueDate < new Date().toISOString().split('T')[0])) {
      return 'bg-red-500';
    }
    return 'bg-yellow-500';
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'pagado') return 'Pagado';
    if (status === 'vencido' || (status === 'pendiente' && dueDate < new Date().toISOString().split('T')[0])) {
      return 'Vencido';
    }
    return 'Pendiente';
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (!user) throw new Error("Usuario no autenticado");

      // Validar según tipo de cobro
      if (values.collection_type === "credito_moderna" && selectedInstallments.size === 0) {
        toast({
          title: "Error",
          description: "Debes seleccionar al menos una cuota de crédito.",
          variant: "destructive",
        });
        return;
      }

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

      const { data: collectionResult, error: collectionError } = await supabase
        .from("collections")
        .insert([collectionData])
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Si es pago de crédito moderna, actualizar las cuotas
      if (values.collection_type === "credito_moderna" && collectionResult) {
        const allInstallments = [...creditInstallments, ...unifiedInstallments];
        const installmentsToUpdate = allInstallments.filter(inst => 
          selectedInstallments.has(inst.id)
        );

        for (const installment of installmentsToUpdate) {
          const { error: updateError } = await supabase
            .from("credit_moderna_installments")
            .update({
              status: 'pagado',
              paid_at: new Date().toISOString(),
              paid_amount: installment.amount,
              payment_id: collectionResult.id
            })
            .eq('id', installment.id);

          if (updateError) {
            console.error("Error updating installment:", updateError);
          }
        }
      }

      toast({
        title: "Cobro registrado",
        description: values.collection_type === "credito_moderna" 
          ? `Cobro registrado y ${selectedInstallments.size} cuota(s) marcada(s) como pagadas.`
          : "El cobro ha sido registrado exitosamente.",
      });

      form.reset({
        customer_id: customerId || "",
        collection_type: "pago_cuenta",
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
      setSelectedInstallments(new Set());
      setCollectionType("pago_cuenta");
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
    credito_moderna: "Crédito Moderna",
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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

            {/* Selector de tipo de cobro */}
            <FormField
              control={form.control}
              name="collection_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Cobro</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        setCollectionType(value);
                        setSelectedInstallments(new Set());
                        form.setValue("amount", 0);
                      }}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pago_cuenta" id="pago_cuenta" />
                        <Label htmlFor="pago_cuenta">Pago a Cuenta</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="orden" id="orden" />
                        <Label htmlFor="orden">Pago de Orden</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credito_moderna" id="credito_moderna" />
                        <Label htmlFor="credito_moderna">Pago de Crédito Moderna</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selector de orden si tipo es "orden" */}
            {collectionType === "orden" && (
              <FormField
                control={form.control}
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar orden" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
            )}

            {/* Selector de cuotas si tipo es "credito_moderna" */}
            {collectionType === "credito_moderna" && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Seleccionar Cuotas a Pagar</h4>
                  <Badge variant="secondary">
                    {selectedInstallments.size} cuota(s) seleccionada(s)
                  </Badge>
                </div>

                {/* Cuotas Unificadas */}
                {unifiedInstallments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Merge className="h-4 w-4 text-primary" />
                      <h5 className="text-sm font-medium text-primary">Cuotas Unificadas</h5>
                    </div>
                    
                    {Object.entries(
                      unifiedInstallments.reduce((groups, installment) => {
                        const groupKey = installment.notes || 'sin-grupo';
                        if (!groups[groupKey]) groups[groupKey] = [];
                        groups[groupKey].push(installment);
                        return groups;
                      }, {} as Record<string, CreditInstallment[]>)
                    ).map(([groupKey, groupInstallments]) => {
                      const isExpanded = expandedUnified[groupKey] || false;
                      return (
                        <Card key={groupKey} className="border-primary/20">
                          <Collapsible 
                            open={isExpanded} 
                            onOpenChange={(open) => setExpandedUnified(prev => ({ ...prev, [groupKey]: open }))}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <span className="text-sm font-medium">Crédito Unificado ({groupInstallments.length} cuotas)</span>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="p-3 space-y-2">
                                {groupInstallments.map((installment) => (
                                  <div key={installment.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={selectedInstallments.has(installment.id)}
                                        onCheckedChange={() => toggleInstallmentSelection(installment.id, installment.amount)}
                                      />
                                      <div>
                                        <p className="text-sm font-medium">
                                          Cuota {installment.installment_number}/{installment.total_installments}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Vence: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getStatusColor(installment.status, installment.due_date)}>
                                        {getStatusText(installment.status, installment.due_date)}
                                      </Badge>
                                      <span className="text-sm font-bold">${installment.amount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Cuotas por Orden */}
                {creditInstallments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <h5 className="text-sm font-medium">Órdenes Individuales</h5>
                    </div>
                    
                    {Object.entries(
                      creditInstallments.reduce((groups, installment) => {
                        const orderId = installment.order_id || 'manual';
                        if (!groups[orderId]) groups[orderId] = [];
                        groups[orderId].push(installment);
                        return groups;
                      }, {} as Record<string, CreditInstallment[]>)
                    ).map(([orderId, orderInstallments]) => {
                      const orderInfo = orderInfos[orderId];
                      const isExpanded = expandedOrders[orderId] || false;
                      return (
                        <Card key={orderId}>
                          <Collapsible 
                            open={isExpanded} 
                            onOpenChange={(open) => setExpandedOrders(prev => ({ ...prev, [orderId]: open }))}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <span className="text-sm font-medium">
                                      {orderInfo ? `Orden #${orderInfo.order_number}` : 'Orden Manual'}
                                      {' '}({orderInstallments.length} cuotas)
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="p-3 space-y-2">
                                {orderInstallments.map((installment) => (
                                  <div key={installment.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={selectedInstallments.has(installment.id)}
                                        onCheckedChange={() => toggleInstallmentSelection(installment.id, installment.amount)}
                                      />
                                      <div>
                                        <p className="text-sm font-medium">
                                          Cuota {installment.installment_number}/{installment.total_installments}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Vence: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getStatusColor(installment.status, installment.due_date)}>
                                        {getStatusText(installment.status, installment.due_date)}
                                      </Badge>
                                      <span className="text-sm font-bold">${installment.amount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {creditInstallments.length === 0 && unifiedInstallments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay cuotas pendientes para este cliente
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Total</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={collectionType === "credito_moderna"}
                      />
                    </FormControl>
                    {collectionType === "credito_moderna" && (
                      <p className="text-xs text-muted-foreground">
                        El monto se calcula automáticamente según las cuotas seleccionadas
                      </p>
                    )}
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