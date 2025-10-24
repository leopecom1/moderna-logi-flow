import { MainLayout } from '@/components/layout/MainLayout';
import { RoutesViewPanel } from '@/components/logistics/RoutesViewPanel';

const RoutesViewPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visualización de Rutas</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza las rutas de entrega y su progreso en tiempo real
          </p>
        </div>
        <RoutesViewPanel />
      </div>
    </MainLayout>
  );
};

export default RoutesViewPage;
