import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Calendar, FileText, User, Building } from 'lucide-react';

interface MovementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: {
    id: string;
    date: string;
    type: string;
    amount: number;
    description: string;
    customer?: string;
    supplier?: string;
    reference?: string;
    status: string;
    method?: string;
  } | null;
  onConfirmTransfer?: (movementId: string) => void;
}

export const MovementDetailModal: React.FC<MovementDetailModalProps> = ({
  isOpen,
  onClose,
  movement,
  onConfirmTransfer
}) => {
  if (!movement) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      cobro: 'text-green-600',
      pago: 'text-red-600',
      transferencia: 'text-blue-600',
      tarjeta_credito: 'text-purple-600',
      credito_moderna: 'text-orange-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      cobro: "default",
      pago: "destructive", 
      transferencia: "secondary",
      tarjeta_credito: "outline",
      credito_moderna: "secondary"
    };

    const labels: Record<string, string> = {
      cobro: "Cobro",
      pago: "Pago",
      transferencia: "Transferencia", 
      tarjeta_credito: "Tarjeta Crédito",
      credito_moderna: "Crédito Moderna"
    };

    return (
      <Badge variant={variants[type] || "default"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const isTransferPending = movement.type === 'transferencia' && movement.status === 'pendiente';
  const isConfirmedBySales = movement.status === 'confirmado_por_ventas';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Detalle del Movimiento</span>
          </DialogTitle>
          <DialogDescription>
            Información completa del movimiento financiero
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo y Estado */}
          <div className="flex items-center justify-between">
            {getTypeBadge(movement.type)}
            <Badge variant={movement.status === 'confirmado' || movement.status === 'pagado' ? 'default' : 'secondary'}>
              {movement.status === 'confirmado_por_ventas' ? 'Confirmado por Ventas' : movement.status}
            </Badge>
          </div>

          <Separator />

          {/* Monto */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Monto:</span>
            <span className={`text-lg font-bold ${getTypeColor(movement.type)}`}>
              {formatCurrency(movement.amount)}
            </span>
          </div>

          {/* Fecha */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Fecha:</span>
            <span className="text-sm">
              {format(new Date(movement.date), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Descripción:</span>
            </div>
            <p className="text-sm bg-muted p-2 rounded">
              {movement.description}
            </p>
          </div>

          {/* Cliente/Proveedor */}
          {(movement.customer || movement.supplier) && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {movement.customer ? 'Cliente:' : 'Proveedor:'}
              </span>
              <span className="text-sm">
                {movement.customer || movement.supplier}
              </span>
            </div>
          )}

          {/* Método de Pago */}
          {movement.method && (
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Método:</span>
              <span className="text-sm">{movement.method}</span>
            </div>
          )}

          {/* Referencia */}
          {movement.reference && (
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Referencia:</span>
              <span className="text-sm">{movement.reference}</span>
            </div>
          )}

          {/* Botón de confirmación para transferencias pendientes */}
          {isTransferPending && onConfirmTransfer && (
            <>
              <Separator />
              <div className="flex space-x-2">
                <Button 
                  onClick={() => onConfirmTransfer(movement.id)}
                  className="flex-1"
                >
                  Confirmar Llegada
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}

          {/* Botón de confirmación para pagos confirmados por ventas */}
          {isConfirmedBySales && onConfirmTransfer && (
            <>
              <Separator />
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Este pago fue confirmado por ventas en una entrega inmediata. Administración debe confirmar la llegada del dinero.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => onConfirmTransfer(movement.id)}
                  className="flex-1"
                >
                  Confirmar Llegada (Administración)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}

          {!isTransferPending && !isConfirmedBySales && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};