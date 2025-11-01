import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageLoading } from '@/components/ui/message-loading';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

interface CardLiquidation {
  id: string;
  card_type: string;
  liquidation_date: string;
  amount: number;
  status: string;
  expected_arrival_date?: string;
  confirmed_at?: string;
  notes?: string;
  payment_id?: string;
  surcharge_info?: {
    monto_base: number;
    recargo_tarjeta: number;
    total_cobrado: number;
    cuotas_tarjeta: number;
  };
}

export const CardLiquidationsPanel = () => {
  const [selectedCardType, setSelectedCardType] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: liquidations, isLoading, refetch } = useQuery({
    queryKey: ['card-liquidations', selectedCardType],
    queryFn: async () => {
      let query = supabase
        .from('card_liquidations')
        .select('*')
        .order('liquidation_date', { ascending: true });

      if (selectedCardType !== 'all') {
        query = query.eq('card_type', selectedCardType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch collection notes to get surcharge info
      if (data && data.length > 0) {
        const paymentIds = data.map(l => l.payment_id).filter(Boolean);
        
        if (paymentIds.length > 0) {
          const { data: collections } = await supabase
            .from('collections')
            .select('id, notes')
            .in('id', paymentIds);

          // Parse surcharge info and add to liquidations
          return data.map(liquidation => {
            const collection = collections?.find(c => c.id === liquidation.payment_id);
            let surchargeInfo = undefined;
            
            if (collection?.notes?.startsWith('RECARGO_TARJETA:')) {
              try {
                const jsonStr = collection.notes.substring('RECARGO_TARJETA:'.length).split('\n')[0];
                surchargeInfo = JSON.parse(jsonStr);
              } catch (e) {
                console.error('Error parsing surcharge info:', e);
              }
            }
            
            return {
              ...liquidation,
              surcharge_info: surchargeInfo
            };
          });
        }
      }

      return data as CardLiquidation[];
    }
  });

  const confirmLiquidationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'confirmado' | 'no_llegó' }) => {
      const { error } = await supabase
        .from('card_liquidations')
        .update({ 
          status, 
          confirmed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Liquidación actualizada",
        description: "El estado de la liquidación ha sido actualizado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['card-liquidations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la liquidación",
        variant: "destructive"
      });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendiente: "secondary",
      confirmado: "default",
      no_llegó: "destructive"
    };

    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      no_llegó: "No Llegó"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no_llegó':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const groupedLiquidations = liquidations?.reduce((acc, liquidation) => {
    if (!acc[liquidation.card_type]) {
      acc[liquidation.card_type] = [];
    }
    acc[liquidation.card_type].push(liquidation);
    return acc;
  }, {} as Record<string, CardLiquidation[]>) || {};

  const cardTypes = Object.keys(groupedLiquidations);

  // Calculate KPIs
  const totalPending = liquidations?.filter(l => l.status === 'pendiente').length || 0;
  const totalConfirmed = liquidations?.filter(l => l.status === 'confirmado').length || 0;
  const totalAmount = liquidations?.reduce((sum, l) => sum + l.amount, 0) || 0;
  const pendingAmount = liquidations?.filter(l => l.status === 'pendiente').reduce((sum, l) => sum + l.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <MessageLoading />
          <p className="text-muted-foreground">Cargando liquidaciones de tarjetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConfirmed}</div>
            <p className="text-xs text-muted-foreground">
              Liquidaciones confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liquidaciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liquidations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas las liquidaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liquidaciones de Tarjetas</CardTitle>
              <CardDescription>
                Gestiona las liquidaciones de tarjetas de crédito agrupadas por tipo
              </CardDescription>
            </div>
            <Select value={selectedCardType} onValueChange={setSelectedCardType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tarjeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tarjetas</SelectItem>
                {cardTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCardType === 'all' ? (
            // Grouped view
            <div className="space-y-6">
              {cardTypes.map(cardType => (
                <div key={cardType}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>{cardType}</span>
                    <Badge variant="outline">
                      {groupedLiquidations[cardType].length}
                    </Badge>
                  </h3>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha Liquidación</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha Esperada</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedLiquidations[cardType].map((liquidation) => (
                          <TableRow key={liquidation.id}>
                            <TableCell>
                            {format(new Date(`${liquidation.liquidation_date}T00:00:00`), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell className="font-mono">
                              {liquidation.surcharge_info ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">
                                    Base: {formatCurrency(liquidation.surcharge_info.monto_base)}
                                  </div>
                                  <div className="text-xs text-amber-600 dark:text-amber-400">
                                    Interés: {formatCurrency(liquidation.surcharge_info.recargo_tarjeta)}
                                  </div>
                                  <div className="font-bold border-t pt-1">
                                    {formatCurrency(liquidation.surcharge_info.total_cobrado)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {liquidation.surcharge_info.cuotas_tarjeta} cuota{liquidation.surcharge_info.cuotas_tarjeta > 1 ? 's' : ''}
                                  </div>
                                </div>
                              ) : (
                                formatCurrency(liquidation.amount)
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(liquidation.status)}
                                {getStatusBadge(liquidation.status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {liquidation.expected_arrival_date
                                ? format(new Date(`${liquidation.expected_arrival_date}T00:00:00`), 'dd/MM/yyyy', { locale: es })
                                : format(addDays(new Date(`${liquidation.liquidation_date}T00:00:00`), 2), 'dd/MM/yyyy', { locale: es })
                              }
                            </TableCell>
                            <TableCell>
                              {liquidation.status === 'pendiente' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => confirmLiquidationMutation.mutate({ 
                                      id: liquidation.id, 
                                      status: 'confirmado' 
                                    })}
                                    disabled={confirmLiquidationMutation.isPending}
                                  >
                                    Llegó
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => confirmLiquidationMutation.mutate({ 
                                      id: liquidation.id, 
                                      status: 'no_llegó' 
                                    })}
                                    disabled={confirmLiquidationMutation.isPending}
                                  >
                                    No Llegó
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single card type view
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Liquidación</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Esperada</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(groupedLiquidations[selectedCardType] || []).map((liquidation) => (
                    <TableRow key={liquidation.id}>
                      <TableCell>
                        {format(new Date(`${liquidation.liquidation_date}T00:00:00`), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="font-mono">
                        {liquidation.surcharge_info ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Base: {formatCurrency(liquidation.surcharge_info.monto_base)}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                              Interés: {formatCurrency(liquidation.surcharge_info.recargo_tarjeta)}
                            </div>
                            <div className="font-bold border-t pt-1">
                              {formatCurrency(liquidation.surcharge_info.total_cobrado)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {liquidation.surcharge_info.cuotas_tarjeta} cuota{liquidation.surcharge_info.cuotas_tarjeta > 1 ? 's' : ''}
                            </div>
                          </div>
                        ) : (
                          formatCurrency(liquidation.amount)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(liquidation.status)}
                          {getStatusBadge(liquidation.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {liquidation.expected_arrival_date
                          ? format(new Date(`${liquidation.expected_arrival_date}T00:00:00`), 'dd/MM/yyyy', { locale: es })
                          : format(addDays(new Date(`${liquidation.liquidation_date}T00:00:00`), 2), 'dd/MM/yyyy', { locale: es })
                        }
                      </TableCell>
                      <TableCell>
                        {liquidation.status === 'pendiente' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => confirmLiquidationMutation.mutate({ 
                                id: liquidation.id, 
                                status: 'confirmado' 
                              })}
                              disabled={confirmLiquidationMutation.isPending}
                            >
                              Llegó
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmLiquidationMutation.mutate({ 
                                id: liquidation.id, 
                                status: 'no_llegó' 
                              })}
                              disabled={confirmLiquidationMutation.isPending}
                            >
                              No Llegó
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(!liquidations || liquidations.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No hay liquidaciones de tarjetas registradas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};