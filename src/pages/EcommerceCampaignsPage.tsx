import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useEcommerceCampaigns } from '@/hooks/useEcommerceCampaigns';
import { CampaignsList } from '@/components/campaigns/CampaignsList';
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal';
import { EcommerceCampaign } from '@/hooks/useEcommerceCampaigns';
import { toast } from 'sonner';

export default function EcommerceCampaignsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: campaigns, isLoading } = useEcommerceCampaigns();

  const handleViewCampaign = (campaign: EcommerceCampaign) => {
    toast.info(`Viendo campaña: ${campaign.name}`);
    // TODO: Implementar vista detallada de campaña
  };

  const handleRevertCampaign = (campaign: EcommerceCampaign) => {
    toast.info(`Revertir campaña: ${campaign.name}`);
    // TODO: Implementar reversión de campaña
  };

  const handleCampaignCreated = (campaignId: string) => {
    toast.success('Campaña creada exitosamente. Ahora puedes aplicarla a WooCommerce.');
    // TODO: Implementar aplicación de campaña
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campañas E-commerce</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona promociones masivas para tus productos de WooCommerce
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Campaña
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns ? (
          <CampaignsList
            campaigns={campaigns}
            onViewCampaign={handleViewCampaign}
            onRevertCampaign={handleRevertCampaign}
          />
        ) : null}
      </div>

      <CreateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCampaignCreated={handleCampaignCreated}
      />
    </MainLayout>
  );
}
