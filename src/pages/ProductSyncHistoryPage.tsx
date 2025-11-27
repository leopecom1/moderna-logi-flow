import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProductSyncHistoryPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);

  const { data: syncJobs, isLoading } = useQuery({
    queryKey: ['syncJobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: jobItems } = useQuery({
    queryKey: ['syncJobItems', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      
      const { data, error } = await supabase
        .from('sync_job_items')
        .select('*')
        .eq('job_id', selectedJobId)
        .eq('status', 'error');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedJobId,
  });

  const handleViewErrors = (jobId: string) => {
    setSelectedJobId(jobId);
    setErrorDetailsOpen(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Historial de Sincronización</h1>
          <p className="text-muted-foreground">
            Registro de trabajos de sincronización entre WooCommerce y Shopify
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trabajos de Sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !syncJobs || syncJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay historial de sincronización todavía
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Completados</TableHead>
                      <TableHead>Errores</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          {format(new Date(job.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {job.status === 'completed' && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completado
                            </Badge>
                          )}
                          {job.status === 'processing' && (
                            <Badge variant="secondary" className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              En proceso
                            </Badge>
                          )}
                          {job.status === 'pending' && (
                            <Badge variant="outline" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pendiente
                            </Badge>
                          )}
                          {job.status === 'failed' && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Fallido
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{job.total_products}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {job.completed_products}
                        </TableCell>
                        <TableCell>
                          {job.failed_products > 0 ? (
                            <span className="text-red-600 font-medium">
                              {job.failed_products}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.failed_products > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewErrors(job.id)}
                            >
                              Ver errores
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={errorDetailsOpen} onOpenChange={setErrorDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Errores</DialogTitle>
          </DialogHeader>
          {jobItems && jobItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto WooCommerce</TableHead>
                  <TableHead>Producto Shopify</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.woocommerce_product_name}
                      <div className="text-xs text-muted-foreground">
                        ID: {item.woocommerce_product_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.shopify_product_name}
                      <div className="text-xs text-muted-foreground">
                        ID: {item.shopify_product_id}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-red-600">
                      {item.error_message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay errores para mostrar
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
