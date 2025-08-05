import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Star, TrendingUp, Clock, CheckCircle, AlertTriangle, FileText, Receipt, DollarSign } from 'lucide-react';

interface QualityMetrics {
  customer_satisfaction: number;
  on_time_delivery: number;
  order_accuracy: number;
  complaint_rate: number;
  resolution_time: number;
  nps_score: number;
}

interface Invoice {
  id: string;
  customer_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_date: string;
  items: number;
}

export const QualityAndBilling = () => {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateData = () => {
      const qualityMetrics: QualityMetrics = {
        customer_satisfaction: 4.7,
        on_time_delivery: 94.2,
        order_accuracy: 97.8,
        complaint_rate: 2.1,
        resolution_time: 24,
        nps_score: 68
      };

      const invoiceData: Invoice[] = [
        {
          id: 'INV-001',
          customer_name: 'Panadería San Martín',
          amount: 2350,
          status: 'paid',
          due_date: '2024-06-15',
          created_date: '2024-06-01',
          items: 12
        },
        {
          id: 'INV-002',
          customer_name: 'Restaurante El Buen Sabor',
          amount: 1890,
          status: 'sent',
          due_date: '2024-06-20',
          created_date: '2024-06-05',
          items: 8
        },
        {
          id: 'INV-003',
          customer_name: 'Café Central',
          amount: 980,
          status: 'overdue',
          due_date: '2024-05-30',
          created_date: '2024-05-15',
          items: 5
        }
      ];

      setMetrics(qualityMetrics);
      setInvoices(invoiceData);
      setLoading(false);
    };

    generateData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'overdue': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sistema de Calidad y Facturación</h2>
        <p className="text-muted-foreground">
          Control de calidad y facturación automatizada
        </p>
      </div>

      <Tabs defaultValue="quality" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quality">Control de Calidad</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Satisfacción Cliente</p>
                    <p className="text-2xl font-bold">{metrics.customer_satisfaction}/5</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entregas a Tiempo</p>
                    <p className="text-2xl font-bold">{metrics.on_time_delivery}%</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">NPS Score</p>
                    <p className="text-2xl font-bold">{metrics.nps_score}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Facturas</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monto Total</p>
                    <p className="text-2xl font-bold">${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pagadas</p>
                    <p className="text-2xl font-bold">{invoices.filter(i => i.status === 'paid').length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vencidas</p>
                    <p className="text-2xl font-bold">{invoices.filter(i => i.status === 'overdue').length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Facturas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{invoice.customer_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {invoice.id} • {invoice.items} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};