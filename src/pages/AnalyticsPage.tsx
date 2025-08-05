import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics';
import { RecommendationEngine } from '@/components/analytics/RecommendationEngine';
import { RealtimeAnalytics } from '@/components/reports/RealtimeAnalytics';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Machine Learning</h1>
          <p className="text-muted-foreground">
            Análisis predictivo, recomendaciones inteligentes y insights avanzados con IA
          </p>
        </div>

        <Tabs defaultValue="predictive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictive">Análisis Predictivo</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendaciones IA</TabsTrigger>
            <TabsTrigger value="realtime">Analytics en Tiempo Real</TabsTrigger>
          </TabsList>
          
          <TabsContent value="predictive" className="space-y-6">
            <PredictiveAnalytics />
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-6">
            <RecommendationEngine />
          </TabsContent>
          
          <TabsContent value="realtime" className="space-y-6">
            <RealtimeAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}