import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Settings, Calendar, DollarSign, Receipt, Send } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreateCashRegisterModal } from '@/components/forms/CreateCashRegisterModal';
import { DailyCashClosureModal } from '@/components/forms/DailyCashClosureModal';
import { PettyCashExpenseModal } from '@/components/forms/PettyCashExpenseModal';
import { CashRegisterConfigModal } from '@/components/forms/CashRegisterConfigModal';
import { SendToCentralModal } from '@/components/forms/SendToCentralModal';

interface BranchCashRegister {
  id: string;
  branch_id: string;
  name: string;
  initial_amount: number;
  current_balance: number;
  is_active: boolean;
  branch_name?: string;
}

interface DailyCashClosure {
  id: string;
  closure_date: string;
  opening_balance: number;
  system_calculated_balance: number;
  manual_cash_count: number | null;
  difference: number | null;
  sent_to_central: boolean;
  closed_by_name?: string;
}

interface PettyCashExpense {
  id: string;
  expense_date: string;
  amount: number;
  description: string;
  category: string;
  created_by_name?: string;
}

interface DayMovement {
  id: string;
  type: 'payment' | 'collection' | 'expense';
  amount: number;
  payment_method: string;
  description: string;
  created_at: string;
}

export default function CashManagementPage() {
  const { toast } = useToast();
  const [cashRegisters, setCashRegisters] = useState<BranchCashRegister[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<string>('');
  const [dailyClosures, setDailyClosures] = useState<DailyCashClosure[]>([]);
  const [expenses, setExpenses] = useState<PettyCashExpense[]>([]);
  const [dayMovements, setDayMovements] = useState<DayMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSendToCentralModal, setShowSendToCentralModal] = useState(false);

  useEffect(() => {
    fetchCashRegisters();
  }, []);

  useEffect(() => {
    if (selectedRegister) {
      fetchDailyClosures();
      fetchExpenses();
      fetchDayMovements();
    }
  }, [selectedRegister]);

  const fetchCashRegisters = async () => {
    try {
      const { data: registersData, error: registersError } = await supabase
        .from('branch_cash_registers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (registersError) throw registersError;

      // Obtener nombres de sucursales
      const branchIds = registersData?.map(r => r.branch_id) || [];
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name')
        .in('id', branchIds);

      const registersWithBranches = registersData?.map(register => ({
        ...register,
        branch_name: branchesData?.find(b => b.id === register.branch_id)?.name
      })) || [];
      
      setCashRegisters(registersWithBranches);
      if (registersWithBranches.length > 0 && !selectedRegister) {
        setSelectedRegister(registersWithBranches[0].id);
      }
    } catch (error) {
      console.error('Error fetching cash registers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cajas registradoras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyClosures = async () => {
    if (!selectedRegister) return;

    try {
      const { data: closuresData, error: closuresError } = await supabase
        .from('daily_cash_closures')
        .select('*')
        .eq('cash_register_id', selectedRegister)
        .order('closure_date', { ascending: false })
        .limit(10);

      if (closuresError) throw closuresError;

      // Obtener nombres de usuarios
      const userIds = closuresData?.map(c => c.closed_by) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const closuresWithNames = closuresData?.map(closure => ({
        ...closure,
        closed_by_name: profilesData?.find(p => p.user_id === closure.closed_by)?.full_name
      })) || [];

      setDailyClosures(closuresWithNames);
    } catch (error) {
      console.error('Error fetching daily closures:', error);
    }
  };

  const fetchExpenses = async () => {
    if (!selectedRegister) return;

    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('petty_cash_expenses')
        .select('*')
        .eq('cash_register_id', selectedRegister)
        .order('expense_date', { ascending: false })
        .limit(10);

      if (expensesError) throw expensesError;

      // Obtener nombres de usuarios
      const userIds = expensesData?.map(e => e.created_by) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const expensesWithNames = expensesData?.map(expense => ({
        ...expense,
        created_by_name: profilesData?.find(p => p.user_id === expense.created_by)?.full_name
      })) || [];

      setExpenses(expensesWithNames);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchDayMovements = async () => {
    if (!selectedRegister) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const movements: DayMovement[] = [];

      // Obtener pagos del día (todos los status)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_method,
          status,
          created_at,
          orders!inner(
            id,
            order_number
          )
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (paymentsError) throw paymentsError;

      paymentsData?.forEach(payment => {
        movements.push({
          id: payment.id,
          type: 'payment',
          amount: payment.amount,
          payment_method: payment.payment_method,
          description: `Pago orden ${payment.orders?.order_number} (${payment.status})`,
          created_at: payment.created_at
        });
      });

      // Obtener cobranzas del día
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .eq('collection_date', today)
        .eq('collection_status', 'confirmado');

      if (collectionsError) throw collectionsError;

      collectionsData?.forEach(collection => {
        movements.push({
          id: collection.id,
          type: 'collection',
          amount: collection.amount,
          payment_method: collection.payment_method_type,
          description: `Cobranza ${collection.receipt_number || 'Sin número'}`,
          created_at: collection.created_at
        });
      });

      // Obtener gastos del día
      const { data: expensesData, error: expensesError } = await supabase
        .from('petty_cash_expenses')
        .select('*')
        .eq('cash_register_id', selectedRegister)
        .eq('expense_date', today);

      if (expensesError) throw expensesError;

      expensesData?.forEach(expense => {
        movements.push({
          id: expense.id,
          type: 'expense',
          amount: -expense.amount,
          payment_method: 'efectivo',
          description: expense.description,
          created_at: expense.created_at
        });
      });

      // Ordenar por fecha
      movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDayMovements(movements);
    } catch (error) {
      console.error('Error fetching day movements:', error);
    }
  };

  const getPaymentMethodTotal = (method: string) => {
    return dayMovements
      .filter(m => m.payment_method === method)
      .reduce((sum, m) => sum + m.amount, 0);
  };

  const currentRegister = cashRegisters.find(r => r.id === selectedRegister);
  const todaysClosure = dailyClosures.find(c => 
    new Date(c.closure_date).toDateString() === new Date().toDateString()
  );

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cajas</h1>
          <p className="text-muted-foreground">
            Gestiona las cajas de las sucursales, cierres diarios y gastos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowConfigModal(true)} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Caja
          </Button>
        </div>
      </div>

      {cashRegisters.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay cajas registradoras</h3>
            <p className="text-muted-foreground mb-4">
              Crea la primera caja registradora para comenzar
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Caja
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Selector de Caja */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Caja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cashRegisters.map((register) => (
                  <Card 
                    key={register.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRegister === register.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRegister(register.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{register.name}</h3>
                        <Badge variant="secondary">
                          {register.branch_name || 'Sin sucursal'}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        ${register.current_balance.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Saldo actual</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {currentRegister && (
            <Tabs defaultValue="today" className="space-y-4">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="today">Hoy</TabsTrigger>
                  <TabsTrigger value="closures">Cierres</TabsTrigger>
                  <TabsTrigger value="expenses">Gastos</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowExpenseModal(true)} 
                    variant="outline" 
                    size="sm"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Nuevo Gasto
                  </Button>
                  <Button 
                    onClick={() => setShowSendToCentralModal(true)} 
                    variant="outline" 
                    size="sm"
                    disabled={!todaysClosure || todaysClosure.sent_to_central}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar a Central
                  </Button>
                  <Button 
                    onClick={() => setShowClosureModal(true)} 
                    size="sm"
                    disabled={!!todaysClosure}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {todaysClosure ? 'Cierre Realizado' : 'Realizar Cierre'}
                  </Button>
                </div>
              </div>

              <TabsContent value="today" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${currentRegister.initial_amount.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${currentRegister.current_balance.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Estado del Día</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant={todaysClosure ? "default" : "destructive"}>
                          {todaysClosure ? "Cerrado" : "Pendiente"}
                        </Badge>
                        {todaysClosure && (
                          <div className="text-sm text-muted-foreground">
                            Diferencia: ${todaysClosure.difference?.toLocaleString() || 0}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabla de Movimientos del Día */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Movimientos del Día</CardTitle>
                      <CardDescription>
                        Todos los movimientos registrados hoy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descripción</TableHead>
                              <TableHead>Método</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayMovements.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                  No hay movimientos registrados hoy
                                </TableCell>
                              </TableRow>
                            ) : (
                              dayMovements.map((movement) => (
                                <TableRow key={`${movement.type}-${movement.id}`}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{movement.description}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(movement.created_at).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {movement.payment_method}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={movement.amount >= 0 ? "text-green-600" : "text-red-600"}>
                                      {movement.amount >= 0 ? "+" : ""}${Math.abs(movement.amount).toLocaleString()}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen por Medio de Pago</CardTitle>
                      <CardDescription>
                        Totales del día por método de pago
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia'].map((method) => {
                          const total = getPaymentMethodTotal(method);
                          const methodName = {
                            'efectivo': 'Efectivo',
                            'tarjeta_credito': 'Tarjeta de Crédito',
                            'tarjeta_debito': 'Tarjeta de Débito',
                            'transferencia': 'Transferencia'
                          }[method] || method;

                          if (total === 0) return null;

                          return (
                            <div key={method} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                              <span className="font-medium">{methodName}</span>
                              <span className={`font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${Math.abs(total).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                        {dayMovements.length === 0 && (
                          <p className="text-center text-muted-foreground">
                            No hay movimientos para mostrar
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="closures" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Cierres</CardTitle>
                    <CardDescription>
                      Historial de cierres de caja diarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dailyClosures.map((closure) => (
                        <div key={closure.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold">
                              {new Date(closure.closure_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Cerrado por: {closure.closed_by_name || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              Diferencia: ${closure.difference?.toLocaleString() || 0}
                            </p>
                            <Badge variant={closure.sent_to_central ? "default" : "secondary"}>
                              {closure.sent_to_central ? "Enviado" : "En caja"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gastos de Caja Chica</CardTitle>
                    <CardDescription>
                      Últimos gastos registrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {expense.category} • {new Date(expense.expense_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Por: {expense.created_by_name || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-destructive">
                              -${expense.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {/* Modales */}
      <CreateCashRegisterModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          fetchCashRegisters();
          setShowCreateModal(false);
        }}
      />

      {selectedRegister && (
        <>
          <DailyCashClosureModal 
            open={showClosureModal} 
            onOpenChange={setShowClosureModal}
            cashRegisterId={selectedRegister}
            onSuccess={() => {
              fetchDailyClosures();
              fetchCashRegisters();
              setShowClosureModal(false);
            }}
          />

          <PettyCashExpenseModal 
            open={showExpenseModal} 
            onOpenChange={setShowExpenseModal}
            cashRegisterId={selectedRegister}
            onSuccess={() => {
              fetchExpenses();
              fetchDayMovements();
              setShowExpenseModal(false);
            }}
          />

          <SendToCentralModal 
            open={showSendToCentralModal} 
            onOpenChange={setShowSendToCentralModal}
            closure={todaysClosure}
            onSuccess={() => {
              fetchDailyClosures();
              setShowSendToCentralModal(false);
            }}
          />
        </>
      )}

      <CashRegisterConfigModal 
        open={showConfigModal} 
        onOpenChange={setShowConfigModal}
      />
      </div>
    </MainLayout>
  );
}