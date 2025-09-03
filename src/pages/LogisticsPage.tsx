import { MainLayout } from "@/components/layout/MainLayout";
import { LogisticsModule } from "@/components/logistics/LogisticsModule";

export default function LogisticsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <LogisticsModule />
      </div>
    </MainLayout>
  );
}