import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Calendar, DollarSign, FileText, Building2, MapPin } from 'lucide-react';

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

interface ViewPurchaseModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewPurchaseModal({ purchase, isOpen, onClose }: ViewPurchaseModalProps) {
  if (!purchase) return null;

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
      </DialogContent>
    </Dialog>
  );
}