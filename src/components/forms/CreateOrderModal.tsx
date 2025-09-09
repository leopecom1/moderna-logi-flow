import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { GoogleMap } from '@/components/ui/google-map';
import { Plus, Package, MapPin, Search, Minus } from 'lucide-react';
import { CreditModernaOrderForm, CreditModernaData } from './CreditModernaOrderForm';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

const TARJETAS_CREDITO_URUGUAY = [
  'Visa',
  'Mastercard',
  'American Express',
  'Diners Club',
  'Oca',
  'Creditel',
  'Lider',
  'Cabal'
];

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  departamento?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  price_list_1: number;
  price_list_2: number;
}

interface Warehouse {
  id: string;
  name: string;
}

interface OrderProduct {
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  unit_price: number;
  available_stock: number;
  needs_movement: boolean;
  variant_id?: string;
}

interface Branch {
  id: string;
  name: string;
}

export const CreateOrderModal = ({ open, onOpenChange, onOrderCreated }: CreateOrderModalProps) => {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<any>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [showCreditModernaForm, setShowCreditModernaForm] = useState(false);
  const [creditModernaData, setCreditModernaData] = useState<CreditModernaData | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    branch_id: '',
    payment_method: '',
    price_list: 'price_list_1', // Nueva selección de lista de precio
    delivery_date: '',
    delivery_address: '',
    delivery_neighborhood: '',
    delivery_departamento: '',
    delivery_time_slot: '',
    notes: '',
    // Campos para nuevo cliente
    create_new_customer: false,
    new_customer_name: '',
    new_customer_email: '',
    new_customer_phone: '',
    new_customer_departamento: '',
      // Campos adicionales para métodos de pago
      tarjeta_credito_tipo: '',
      numero_comprobante: '',
      cantidad_cuotas: '',
  });
  const [priceListConfig, setPriceListConfig] = useState({
    price_list_1_name: 'Lista 1',
    price_list_2_name: 'Lista 2'
  });

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchProducts();
      fetchWarehouses();
      fetchBranches();
      fetchPriceListConfig();
      generateOrderNumber();
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, address, neighborhood, departamento')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, price, price_list_1, price_list_2')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchPriceListConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('price_lists_config')
        .select('price_list_1_name, price_list_2_name')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPriceListConfig({
          price_list_1_name: data.price_list_1_name,
          price_list_2_name: data.price_list_2_name,
        });
      }
    } catch (error) {
      console.error('Error fetching price list config:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `PED-${timestamp}${random}`;
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        delivery_address: customer.address,
        delivery_neighborhood: customer.neighborhood || '',
        delivery_departamento: customer.departamento || '',
      }));
    }
  };

  const addProduct = () => {
    setOrderProducts(prev => [...prev, {
      product_id: '',
      product_name: '',
      warehouse_id: '',
      warehouse_name: '',
      quantity: 1,
      unit_price: 0,
      available_stock: 0,
      needs_movement: false,
    }]);
  };

  const removeProduct = (index: number) => {
    setOrderProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = async (index: number, field: keyof OrderProduct, value: any) => {
    const updatedProducts = [...orderProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };

    // Si se cambió el producto, actualizar precio y verificar stock
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedProducts[index].product_name = product.name;
        // Usar el precio de la lista seleccionada
        const selectedPrice = formData.price_list === 'price_list_1' ? product.price_list_1 : product.price_list_2;
        updatedProducts[index].unit_price = selectedPrice;
      }
    }

    // Si se cambió el producto o depósito, verificar stock
    if (field === 'product_id' || field === 'warehouse_id') {
      const productData = updatedProducts[index];
      if (productData.product_id && productData.warehouse_id) {
        await checkStock(index, productData.product_id, productData.warehouse_id, updatedProducts);
      }
    }

    setOrderProducts(updatedProducts);
  };

  const checkStock = async (index: number, productId: string, warehouseId: string, products: OrderProduct[]) => {
    try {
      // Verificar stock en el depósito específico (de la sucursal)
      const { data: branchStock, error: branchError } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId)
        .single();

      const requiredQuantity = products[index].quantity;
      let hasStockInBranch = false;
      
      if (!branchError && branchStock) {
        hasStockInBranch = branchStock.current_stock >= requiredQuantity;
        products[index].available_stock = branchStock.current_stock;
      } else {
        products[index].available_stock = 0;
      }

      if (hasStockInBranch) {
        // Hay stock suficiente en la sucursal
        products[index].needs_movement = false;
      } else {
        // No hay stock suficiente en la sucursal, verificar otros depósitos
        const { data: otherStock, error: otherError } = await supabase
          .from('inventory_items')
          .select('current_stock, warehouse_id')
          .eq('product_id', productId)
          .neq('warehouse_id', warehouseId)
          .gt('current_stock', 0);

        if (!otherError && otherStock && otherStock.length > 0) {
          // Verificar si hay stock suficiente en otros depósitos
          const totalOtherStock = otherStock.reduce((sum, item) => sum + item.current_stock, 0);
          
          if (totalOtherStock >= requiredQuantity) {
            // Hay stock en otros depósitos, necesita movimiento interno
            products[index].needs_movement = true;
            products[index].available_stock = totalOtherStock;
          } else {
            // No hay stock suficiente en ningún lado, necesita compra
            products[index].needs_movement = true;
            products[index].available_stock = 0;
          }
        } else {
          // No hay stock en ningún depósito, necesita compra
          products[index].needs_movement = true;
          products[index].available_stock = 0;
        }
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      products[index].available_stock = 0;
      products[index].needs_movement = true;
    }
  };

  const getTotalAmount = () => {
    return orderProducts.reduce((total, product) => {
      return total + (product.quantity * product.unit_price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    // Si es crédito moderna y no tenemos los datos, abrir el formulario
    if (formData.payment_method === 'credito_moderna' && !creditModernaData) {
      setShowCreditModernaForm(true);
      return;
    }

    try {
      setLoading(true);
      let customerId = formData.customer_id;

      // Si se está creando un nuevo cliente
      if (formData.create_new_customer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: formData.new_customer_name,
            email: formData.new_customer_email || null,
            phone: formData.new_customer_phone || null,
            address: formData.delivery_address,
            neighborhood: formData.delivery_neighborhood || null,
            city: 'Santa Fe',
            departamento: formData.new_customer_departamento || null,
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Determinar el estado inicial del pedido basado en stock y método de pago
      let initialStatus: 'pendiente' | 'pendiente_compra' | 'movimiento_interno_pendiente' | 'pendiente_confirmacion_transferencia' | 'pendiente_envio' = 'pendiente';
      
      const hasOutOfStockProducts = orderProducts.some(p => p.needs_movement && p.available_stock === 0);
      const hasMovementNeeded = orderProducts.some(p => p.needs_movement && p.available_stock > 0);
      const isTransfer = formData.payment_method === 'transferencia';
      
      if (hasOutOfStockProducts) {
        initialStatus = 'pendiente_compra';
      } else if (hasMovementNeeded) {
        initialStatus = 'movimiento_interno_pendiente';
      } else if (isTransfer) {
        initialStatus = 'pendiente_confirmacion_transferencia';
      } else {
        initialStatus = 'pendiente_envio';
      }

      const orderData = {
        customer_id: customerId,
        seller_id: profile.user_id,
        branch_id: formData.branch_id,
        products: JSON.stringify(orderProducts),
        total_amount: getTotalAmount(),
        payment_method: formData.payment_method as any,
        delivery_date: formData.delivery_date,
        delivery_address: formData.delivery_address,
        delivery_neighborhood: formData.delivery_neighborhood,
        delivery_departamento: formData.delivery_departamento,
        delivery_time_slot: formData.delivery_time_slot,
        notes: formData.notes,
        order_number: generateOrderNumber(),
        status: initialStatus,
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Si es Crédito Moderna, crear las cuotas
      if (formData.payment_method === 'credito_moderna' && creditModernaData) {
        const creditInstallments = creditModernaData.installments.map(installment => ({
          customer_id: customerId,
          order_id: order.id,
          installment_number: installment.number,
          total_installments: creditModernaData.installment_count,
          amount: installment.amount,
          due_date: installment.due_date,
          status: 'pendiente',
          created_by: profile.user_id,
        }));

        const { error: creditError } = await supabase
          .from('credit_moderna_installments')
          .insert(creditInstallments);

        if (creditError) {
          console.error('Error creating credit installments:', creditError);
          toast({
            title: 'Pedido creado con advertencia',
            description: 'El pedido se creó pero hubo un problema al generar las cuotas de crédito. Puede crearlas manualmente desde el cliente.',
            variant: 'default',
          });
        }

        // Si hay pago inicial, registrarlo
        if (creditModernaData.advance_payment > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert([{
              order_id: order.id,
              amount: creditModernaData.advance_payment,
              payment_method: 'efectivo' as const,
              status: 'pagado' as const,
            }]);

          if (paymentError) {
            console.error('Error creating advance payment:', paymentError);
          }
        }
      }

      // Crear compras solicitadas para productos sin stock
      const outOfStockProducts = orderProducts.filter(p => p.needs_movement && p.available_stock === 0);
      if (outOfStockProducts.length > 0) {
        const requestedPurchasesData = outOfStockProducts.map(product => ({
          order_id: order.id,
          product_id: product.product_id,
          variant_id: product.variant_id || null,
          quantity: product.quantity,
          unit_cost: product.unit_price,
          notes: `Solicitado para pedido ${orderData.order_number}`,
          requested_by: profile.user_id,
        }));

        const { error: purchaseRequestError } = await supabase
          .from('requested_purchases')
          .insert(requestedPurchasesData);

        if (purchaseRequestError) {
          console.error('Error creating purchase requests:', purchaseRequestError);
        }
      }

      // Crear movimientos internos para productos que necesitan movimiento entre sucursales
      const movementProducts = orderProducts.filter(p => p.needs_movement && p.available_stock > 0);
      if (movementProducts.length > 0) {
        const movementPromises = movementProducts.map(product => {
          return supabase
            .from('inventory_movements')
            .insert([{
              inventory_item_id: null, // Se manejará después
              movement_type: 'movimiento_interno',
              quantity: product.quantity,
              unit_cost: product.unit_price || 0,
              notes: `Movimiento interno para pedido ${orderData.order_number} - ${product.product_name}`,
              user_id: profile.user_id,
              reference_document: orderData.order_number,
              status: 'pendiente'
            }]);
        });

        await Promise.all(movementPromises);
      }

      let toastMessage = 'El pedido ha sido creado exitosamente';
      if (hasOutOfStockProducts) {
        toastMessage = 'El pedido ha sido creado. Se generaron solicitudes de compra para productos sin stock.';
      } else if (hasMovementNeeded) {
        toastMessage = 'El pedido ha sido creado. Se generaron movimientos internos para productos de otras sucursales.';
      } else if (isTransfer) {
        toastMessage = 'El pedido ha sido creado. Pendiente de confirmación de transferencia.';
      }

      toast({
        title: 'Pedido creado',
        description: toastMessage,
      });

      onOrderCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el pedido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      branch_id: '',
      payment_method: '',
      price_list: 'price_list_1',
      delivery_date: '',
      delivery_address: '',
      delivery_neighborhood: '',
      delivery_departamento: '',
      delivery_time_slot: '',
      notes: '',
      create_new_customer: false,
      new_customer_name: '',
      new_customer_email: '',
      new_customer_phone: '',
      new_customer_departamento: '',
      // Resetear campos de pago
      tarjeta_credito_tipo: '',
      numero_comprobante: '',
      cantidad_cuotas: '',
    });
    setOrderProducts([]);
    setSelectedPlaceDetails(null);
    setIsManualInput(false);
    setShowMap(false);
    setCreditModernaData(null);
    setShowCreditModernaForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking on Google Places dropdown
          const target = e.target as Element;
          if (target.closest('.pac-container') || target.closest('.pac-item')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Crear Nuevo Pedido</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para crear un nuevo pedido
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_new_customer"
                checked={formData.create_new_customer}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  create_new_customer: !!checked,
                  customer_id: checked ? '' : prev.customer_id
                }))}
              />
              <Label htmlFor="create_new_customer">Crear nuevo cliente</Label>
            </div>

            {!formData.create_new_customer ? (
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente *</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_customer_name">Nombre del Cliente *</Label>
                  <Input
                    id="new_customer_name"
                    placeholder="Nombre completo"
                    value={formData.new_customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_customer_name: e.target.value }))}
                    required={formData.create_new_customer}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_customer_email">Email</Label>
                  <Input
                    id="new_customer_email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.new_customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_customer_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_customer_phone">Teléfono</Label>
                  <Input
                    id="new_customer_phone"
                    placeholder="099 123 456"
                    value={formData.new_customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_customer_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_customer_departamento">Departamento</Label>
                  <Select value={formData.new_customer_departamento} onValueChange={(value) => setFormData(prev => ({ ...prev, new_customer_departamento: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS_URUGUAY.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Productos *</Label>
              <Button type="button" onClick={addProduct} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            {orderProducts.map((product, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Producto {index + 1}</span>
                  {orderProducts.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeProduct(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Producto *</Label>
                    <Select 
                      value={product.product_id} 
                      onValueChange={(value) => updateProduct(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => {
                          const selectedPrice = formData.price_list === 'price_list_1' ? p.price_list_1 : p.price_list_2;
                          return (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} - ${selectedPrice}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Depósito *</Label>
                    <Select 
                      value={product.warehouse_id} 
                      onValueChange={(value) => {
                        const warehouse = warehouses.find(w => w.id === value);
                        updateProduct(index, 'warehouse_id', value);
                        if (warehouse) {
                          updateProduct(index, 'warehouse_name', warehouse.name);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar depósito" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Precio Unitario</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={product.unit_price}
                      onChange={(e) => updateProduct(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stock Disponible</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={product.available_stock}
                        disabled
                      />
                      {product.needs_movement && (
                        <span className="text-sm text-red-600 font-medium">
                          Sin stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {product.needs_movement && product.product_id && product.warehouse_id && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No hay stock suficiente en {product.warehouse_name}. 
                      Se generará una orden de movimiento automáticamente.
                    </p>
                  </div>
                )}

                <div className="text-right">
                  <span className="text-lg font-semibold">
                    Total: ${(product.quantity * product.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {orderProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay productos agregados</p>
                <Button type="button" onClick={addProduct} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer producto
                </Button>
              </div>
            )}

            {orderProducts.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total del Pedido:</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Método de Pago */}

          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago *</Label>
            <Select value={formData.payment_method} onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                payment_method: value,
                price_list: value === 'credito_moderna' ? 'price_list_2' : prev.price_list
              }));
            }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="credito_moderna">Crédito Moderna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos adicionales para Tarjeta de Crédito */}
            {formData.payment_method === 'tarjeta' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="tarjeta_credito_tipo">Tipo de Tarjeta *</Label>
                  <Select value={formData.tarjeta_credito_tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tarjeta_credito_tipo: value }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARJETAS_CREDITO_URUGUAY.map((tarjeta) => (
                        <SelectItem key={tarjeta} value={tarjeta}>
                          {tarjeta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad_cuotas">Cantidad de Cuotas *</Label>
                  <Select value={formData.cantidad_cuotas} onValueChange={(value) => setFormData(prev => ({ ...prev, cantidad_cuotas: value }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Cuotas" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 12, 18, 24].map((cuotas) => (
                        <SelectItem key={cuotas} value={cuotas.toString()}>
                          {cuotas} {cuotas === 1 ? 'cuota' : 'cuotas'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_comprobante">Número de Comprobante *</Label>
                  <Input
                    id="numero_comprobante"
                    placeholder="Ej: 123456789"
                    value={formData.numero_comprobante}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_comprobante: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}

            {/* Resumen de Crédito Moderna */}
            {formData.payment_method === 'credito_moderna' && creditModernaData && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Resumen Crédito Moderna</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pago inicial:</span>
                    <p className="font-semibold">${creditModernaData.advance_payment.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Saldo en cuotas:</span>
                    <p className="font-semibold">${(getTotalAmount() - creditModernaData.advance_payment).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cantidad de cuotas:</span>
                    <p className="font-semibold">{creditModernaData.installment_count}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Día de pago:</span>
                    <p className="font-semibold">{creditModernaData.payment_day}</p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowCreditModernaForm(true)}
                >
                  Modificar Crédito
                </Button>
              </div>
            )}
          </div>

          {/* Lista de Precio */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Lista de Precio</Label>
            </div>
            
            <div className="space-y-2">
              <Select value={formData.price_list} onValueChange={(value) => setFormData(prev => ({ ...prev, price_list: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lista de precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_list_1">{priceListConfig.price_list_1_name}</SelectItem>
                  <SelectItem value="price_list_2">{formData.payment_method === 'credito_moderna' ? 'Lista Crédito Moderna' : priceListConfig.price_list_2_name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch_id">Sucursal *</Label>
              <Select value={formData.branch_id} onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Fecha de Entrega *</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Dirección de Entrega *</Label>
            <GooglePlacesAutocomplete
              value={formData.delivery_address}
              onChange={(value, placeDetails) => {
                setFormData(prev => ({ ...prev, delivery_address: value }));
                
                // Extraer información adicional del lugar si está disponible
                if (placeDetails?.address_components) {
                  const addressComponents = placeDetails.address_components;
                  const neighborhood = addressComponents.find((comp: any) => 
                    comp.types.includes('sublocality') || comp.types.includes('neighborhood')
                  )?.long_name;
                  
                  if (neighborhood) {
                    setFormData(prev => ({ ...prev, delivery_neighborhood: neighborhood }));
                  }
                }
                
                // Store place details for map
                if (placeDetails) {
                  setSelectedPlaceDetails(placeDetails);
                }
              }}
              placeholder="Comience a escribir la dirección..."
              onManualInput={(manual) => {
                setIsManualInput(manual);
                setShowMap(manual);
              }}
            />
            
            {/* Manual input: show search button */}
            {isManualInput && formData.delivery_address && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMap(true)}
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Buscar en mapa</span>
              </Button>
            )}
            
            {/* Show map when there's data or manual input is enabled */}
            {(showMap || formData.delivery_address || selectedPlaceDetails) && (
              <div className="mt-4">
                <GoogleMap
                  address={formData.delivery_address}
                  placeDetails={selectedPlaceDetails}
                  className="w-full h-48"
                  allowLocationSelect={isManualInput}
                  onLocationSelect={(location, address) => {
                    setFormData(prev => ({ ...prev, delivery_address: address }));
                    setSelectedPlaceDetails({
                      geometry: {
                        location: {
                          lat: () => location.lat,
                          lng: () => location.lng
                        }
                      }
                    });
                    
                    toast({
                      title: "Ubicación seleccionada",
                      description: "La dirección se ha actualizado desde el mapa",
                    });
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_neighborhood">Barrio</Label>
              <Input
                id="delivery_neighborhood"
                placeholder="Barrio"
                value={formData.delivery_neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_neighborhood: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_departamento">Departamento</Label>
              <Select value={formData.delivery_departamento} onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_departamento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS_URUGUAY.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time_slot">Horario de Entrega</Label>
              <Input
                id="delivery_time_slot"
                placeholder="9:00 - 12:00"
                value={formData.delivery_time_slot}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time_slot: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              onOpenChange(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || orderProducts.length === 0 || !formData.customer_id}
            >
              {loading ? 'Creando...' : 
               formData.payment_method === 'credito_moderna' && !creditModernaData ? 'Configurar Crédito' : 
               'Crear Pedido'}
            </Button>
          </div>
        </form>

        {/* Modal de configuración de Crédito Moderna */}
        <CreditModernaOrderForm
          open={showCreditModernaForm}
          onOpenChange={setShowCreditModernaForm}
          totalAmount={getTotalAmount()}
          onConfirm={(data) => {
            setCreditModernaData(data);
            setShowCreditModernaForm(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};