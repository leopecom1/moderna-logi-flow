import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface CreditInstallment {
  id: string;
  customer_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  paid_at?: string;
  paid_amount?: number;
  notes?: string;
  customers: {
    name: string;
    phone?: string;
  };
}

interface CreditMetrics {
  totalPendingAmount: number;
  todayDueAmount: number;
  overdueAmount: number;
  totalInstallments: number;
  paidInstallments: number;
}

function CreditoModernaPage() {
  const [installments, setInstallments] = useState<CreditInstallment[]>([]);
  const [metrics, setMetrics] = useState<CreditMetrics>({
    totalPendingAmount: 0,
    todayDueAmount: 0,
    overdueAmount: 0,
    totalInstallments: 0,
    paidInstallments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchInstallments = async () => {
    console.log("Fetching installments...");
    try {
      const { data, error } = await supabase
        .from("credit_moderna_installments")
        .select(`
          *,
          customers!customer_id (
            name,
            phone
          )
        `)
        .order("due_date", { ascending: true });

      console.log("Query result:", { data, error });

      if (error) throw error;

      setInstallments((data || []) as unknown as CreditInstallment[]);
      calculateMetrics((data || []) as unknown as CreditInstallment[]);
    } catch (error) {
      console.error("Error fetching installments:", error);
      toast.error("Error al cargar las cuotas");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data: CreditInstallment[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    const totalPendingAmount = data
      .filter(item => item.status === 'pendiente')
      .reduce((sum, item) => sum + item.amount, 0);

    const todayDueAmount = data
      .filter(item => item.status === 'pendiente' && item.due_date === today)
      .reduce((sum, item) => sum + item.amount, 0);

    const overdueAmount = data
      .filter(item => item.status === 'vencido' || (item.status === 'pendiente' && item.due_date < today))
      .reduce((sum, item) => sum + item.amount, 0);

    const totalInstallments = data.length;
    const paidInstallments = data.filter(item => item.status === 'pagado').length;

    setMetrics({
      totalPendingAmount,
      todayDueAmount,
      overdueAmount,
      totalInstallments,
      paidInstallments
    });
  };

  const markAsPaid = async (installmentId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from("credit_moderna_installments")
        .update({
          status: 'pagado',
          paid_at: new Date().toISOString(),
          paid_amount: amount
        })
        .eq('id', installmentId);

      if (error) throw error;

      toast.success("Cuota marcada como pagada");
      fetchInstallments();
    } catch (error) {
      console.error("Error updating installment:", error);
      toast.error("Error al actualizar la cuota");
    }
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

  const filteredInstallments = installments.filter(item => {
    const matchesSearch = item.customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.customers.phone && item.customers.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "vencido" && (item.status === 'vencido' || 
                          (item.status === 'pendiente' && item.due_date < new Date().toISOString().split('T')[0]))) ||
                         (statusFilter !== "vencido" && item.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchInstallments();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Crédito Moderna</h1>
            <p className="text-muted-foreground">
              Gestión de cuotas y pagos a crédito
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendiente Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalPendingAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vence Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${metrics.todayDueAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${metrics.overdueAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuotas Pagadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.paidInstallments}/{metrics.totalInstallments}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Buscar por cliente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                  <SelectItem value="pagado">Pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Installments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cuotas de Crédito Moderna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{installment.customers.name}</p>
                          {installment.customers.phone && (
                            <p className="text-sm text-muted-foreground">
                              {installment.customers.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {installment.installment_number}/{installment.total_installments}
                      </TableCell>
                      <TableCell>${installment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(installment.status, installment.due_date)}>
                          {getStatusText(installment.status, installment.due_date)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {installment.status === 'pendiente' && (
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(installment.id, installment.amount)}
                          >
                            Marcar Pagado
                          </Button>
                        )}
                        {installment.status === 'pagado' && installment.paid_at && (
                          <p className="text-sm text-muted-foreground">
                            Pagado el {format(new Date(installment.paid_at), "dd/MM/yyyy", { locale: es })}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredInstallments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron cuotas con los filtros aplicados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default CreditoModernaPage;