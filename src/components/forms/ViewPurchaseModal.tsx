import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Calendar, DollarSign, FileText, Building2, MapPin, Edit, Save, X } from 'lucide-react';

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  is_import: boolean;
  currency: string;
  total_amount: number;
  status: string;
  subtotal: number;
  tax_amount: number;
  exchange_rate?: number;
  payment_days?: number;
  payment_method?: string;
  is_check_payment?: boolean;
  notes?: string;
  suppliers: {
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
}

interface PurchaseItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    code: string;
  };
}

interface ViewPurchaseModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewPurchaseModal({ purchase, isOpen, onClose }: ViewPurchaseModalProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; unit_price: number }>({ quantity: 0, unit_price: 0 });
  const queryClient = useQueryClient();

  if (!purchase) return null;

  // Query purchase items
  const { data: purchaseItems = [], refetch } = useQuery({
    queryKey: ['purchase-items', purchase.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          products (name, code)
        `)
        .eq('purchase_id', purchase.id);

      if (error) throw error;
      return data as PurchaseItem[];
    },
    enabled: isOpen && !!purchase.id,
  });

  // Mutation to update purchase item
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: { quantity: number; unit_price: number; total_price: number } }) => {
      const { error } = await supabase
        .from('purchase_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Artículo actualizado correctamente',
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el artículo',
        variant: 'destructive',
      });
    },
  });

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      UYU: "$U",
      USD: "US$",
      BRL: "R$",
      ARS: "$AR"
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "destructive";
      case "confirmado": return "default";
      case "recibido": return "secondary";
      default: return "outline";
    }
  };

  const handleEdit = (item: PurchaseItem) => {
    setEditingItem(item.id);
    setEditValues({
      quantity: item.quantity,
      unit_price: item.unit_price,
    });
  };

  const handleSave = (itemId: string) => {
    const total_price = editValues.quantity * editValues.unit_price;
    updateItemMutation.mutate({
      itemId,
      updates: {
        ...editValues,
        total_price,
      },
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditValues({ quantity: 0, unit_price: 0 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Compra - {purchase.purchase_number}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número</label>
                  <p className="font-semibold">{purchase.purchase_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(purchase.status)}>
                      {purchase.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    <Badge variant={purchase.is_import ? "default" : "secondary"}>
                      {purchase.is_import ? "Importación" : "Plaza"}
                    </Badge>
                  </div>
                </div>
              </div>

              {purchase.is_import && purchase.exchange_rate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Cambio</label>
                  <p className="font-semibold">{purchase.exchange_rate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información del Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="font-semibold">{purchase.suppliers?.name || "Sin proveedor"}</p>
              </div>

              {purchase.suppliers?.contact_person && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Persona de Contacto</label>
                  <p>{purchase.suppliers.contact_person}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {purchase.suppliers?.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{purchase.suppliers.email}</p>
                  </div>
                )}

                {purchase.suppliers?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p>{purchase.suppliers.phone}</p>
                  </div>
                )}
              </div>

              {purchase.suppliers?.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{purchase.suppliers.address}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                  <p className="font-semibold">{purchase.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subtotal</label>
                  <p className="font-semibold">{formatCurrency(purchase.subtotal, purchase.currency)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Impuestos</label>
                  <p className="font-semibold">{formatCurrency(purchase.tax_amount, purchase.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total</label>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(purchase.total_amount, purchase.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Términos de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método de Pago</label>
                  <p className="font-semibold capitalize">{purchase.payment_method || "No especificado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Días de Pago</label>
                  <p className="font-semibold">{purchase.payment_days || 30} días</p>
                </div>
              </div>

              {purchase.is_check_payment && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Pago</label>
                  <div className="mt-1">
                    <Badge variant="outline">Pago con Cheque</Badge>
                  </div>
                </div>
              )}

              {purchase.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas</label>
                  <p className="text-sm bg-muted p-3 rounded-md">{purchase.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Items Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos de la Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                No hay productos registrados para esta compra
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.products.code}
                      </TableCell>
                      <TableCell>{item.products.name}</TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <Input
                            type="number"
                            value={editValues.quantity}
                            onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                            className="w-20"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValues.unit_price}
                            onChange={(e) => setEditValues(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                            className="w-24"
                          />
                        ) : (
                          formatCurrency(item.unit_price, purchase.currency)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem === item.id
                          ? formatCurrency(editValues.quantity * editValues.unit_price, purchase.currency)
                          : formatCurrency(item.total_price, purchase.currency)
                        }
                      </TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(item.id)}
                              disabled={updateItemMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}