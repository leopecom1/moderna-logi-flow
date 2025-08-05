import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExecutiveDashboard } from '@/components/executive/ExecutiveDashboard';
import { CRMSystem } from '@/components/crm/CRMSystem';
import { InventoryManagement } from '@/components/inventory/InventoryManagement';
import { MainLayout } from '@/components/layout/MainLayout';

export default function BusinessManagementPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión Empresarial Avanzada</h1>
          <p className="text-muted-foreground">
            Sistema integral de gestión con CRM, inventario inteligente y dashboard ejecutivo
          </p>
        </div>

        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="executive">Dashboard Ejecutivo</TabsTrigger>
            <TabsTrigger value="crm">Sistema CRM</TabsTrigger>
            <TabsTrigger value="inventory">Inventario Inteligente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="executive" className="space-y-6">
            <ExecutiveDashboard />
          </TabsContent>
          
          <TabsContent value="crm" className="space-y-6">
            <CRMSystem />
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-6">
            <InventoryManagement />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}