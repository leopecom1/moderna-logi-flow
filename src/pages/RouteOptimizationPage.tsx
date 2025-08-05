import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RouteOptimizer } from '@/components/routes/RouteOptimizer';
import { RouteAnalytics } from '@/components/routes/RouteAnalytics';
import { TrafficAnalyzer } from '@/components/routes/TrafficAnalyzer';

export const RouteOptimizationPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Optimización de Rutas con IA</h1>
        <p className="text-muted-foreground">
          Utiliza algoritmos avanzados e inteligencia artificial para optimizar rutas de entrega
        </p>
      </div>

      <Tabs defaultValue="optimizer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimizer">Optimizador</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="traffic">Tráfico en Vivo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="optimizer" className="space-y-6">
          <RouteOptimizer />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <RouteAnalytics />
        </TabsContent>
        
        <TabsContent value="traffic" className="space-y-6">
          <TrafficAnalyzer />
        </TabsContent>
      </Tabs>
    </div>
  );
};