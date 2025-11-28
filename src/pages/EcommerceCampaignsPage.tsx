import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useEcommerceCampaigns, EcommerceCampaign, useApplyCampaign, useRevertCampaign, ApplyCampaignProgress } from '@/hooks/useEcommerceCampaigns';
import { CampaignsList } from '@/components/campaigns/CampaignsList';
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal';
import { ApplyCampaignModal } from '@/components/campaigns/ApplyCampaignModal';
import { toast } from 'sonner';

export default function EcommerceCampaignsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [applyProgress, setApplyProgress] = useState<ApplyCampaignProgress[]>([]);
  const [revertProgress, setRevertProgress] = useState<ApplyCampaignProgress[]>([]);
  
  const { data: campaigns, isLoading } = useEcommerceCampaigns();
  const applyCampaign = useApplyCampaign();
  const revertCampaign = useRevertCampaign();

  const handleViewCampaign = (campaign: EcommerceCampaign) => {
    toast.info('Ver detalles de campaña - Próximamente');
  };

  const handleApplyCampaign = (campaign: EcommerceCampaign) => {
    setSelectedCampaignId(campaign.id);
    setApplyProgress([]);
    setApplyModalOpen(true);
    
    applyCampaign.mutate(
      { 
        campaignId: campaign.id,
        onProgress: setApplyProgress 
      },
      {
        onSettled: () => {
          // Keep modal open to show results
        },
      }
    );
  };

  const handleRevertCampaign = (campaign: EcommerceCampaign) => {
    setSelectedCampaignId(campaign.id);
    setRevertProgress([]);
    setRevertModalOpen(true);
    
    revertCampaign.mutate(
      { 
        campaignId: campaign.id,
        onProgress: setRevertProgress 
      },
      {
        onSettled: () => {
          // Keep modal open to show results
        },
      }
    );
  };

  const handleCampaignCreated = (campaignId: string) => {
    toast.success('Campaña creada exitosamente');
    setCreateModalOpen(false);
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
            onApplyCampaign={handleApplyCampaign}
            onRevertCampaign={handleRevertCampaign}
          />
        ) : null}
      </div>

      <CreateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCampaignCreated={handleCampaignCreated}
      />

      <ApplyCampaignModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        progress={applyProgress}
        isApplying={applyCampaign.isPending}
        mode="apply"
      />

      <ApplyCampaignModal
        open={revertModalOpen}
        onOpenChange={setRevertModalOpen}
        progress={revertProgress}
        isApplying={revertCampaign.isPending}
        mode="revert"
      />
    </MainLayout>
  );
}
