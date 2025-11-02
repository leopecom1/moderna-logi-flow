import { MainLayout } from '@/components/layout/MainLayout';
import { AssemblyPanel } from '@/components/logistics/AssemblyPanel';
import { Wrench } from 'lucide-react';

const AssemblyPage = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Panel de Armado</h1>
            <p className="text-muted-foreground">
              Gestiona los pedidos que requieren armado
            </p>
          </div>
        </div>

        <AssemblyPanel />
      </div>
    </MainLayout>
  );
};

export default AssemblyPage;
