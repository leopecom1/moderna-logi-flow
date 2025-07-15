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
import { Plus, Package, MapPin, Search } from 'lucide-react';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
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

export const CreateOrderModal = ({ open, onOpenChange, onOrderCreated }: CreateOrderModalProps) => {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<any>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    products: '',
    total_amount: '',
    payment_method: '',
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
  });

  useEffect(() => {
    if (open) {
      fetchCustomers();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

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

      const orderData = {
        customer_id: customerId,
        seller_id: profile.id,
        products: formData.products, // Ahora es texto simple
        total_amount: parseFloat(formData.total_amount),
        payment_method: formData.payment_method as 'efectivo' | 'tarjeta' | 'transferencia' | 'cuenta_corriente',
        delivery_date: formData.delivery_date,
        delivery_address: formData.delivery_address,
        delivery_neighborhood: formData.delivery_neighborhood,
        delivery_departamento: formData.delivery_departamento,
        delivery_time_slot: formData.delivery_time_slot,
        notes: formData.notes,
        order_number: generateOrderNumber(),
        status: 'pendiente' as const,
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      toast({
        title: 'Pedido creado',
        description: 'El pedido ha sido creado exitosamente',
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
      products: '',
      total_amount: '',
      payment_method: '',
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
    });
    setSelectedPlaceDetails(null);
    setIsManualInput(false);
    setShowMap(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Monto Total *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">Productos *</Label>
            <Textarea
              id="products"
              placeholder="Descripción de los productos..."
              value={formData.products}
              onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
              required
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Pedido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};