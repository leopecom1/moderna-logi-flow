import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCreateCampaign, useAddCampaignProducts } from '@/hooks/useEcommerceCampaigns';
import { CampaignProductSelector } from './CampaignProductSelector';
import { CampaignPreview } from './CampaignPreview';
import { WooCommerceProduct } from '@/types/woocommerce';

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated: (campaignId: string) => void;
}

type Step = 'config' | 'products' | 'preview';

export function CreateCampaignModal({ open, onOpenChange, onCampaignCreated }: CreateCampaignModalProps) {
  const [step, setStep] = useState<Step>('config');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState([20]);
  const [selectedProducts, setSelectedProducts] = useState<WooCommerceProduct[]>([]);
  
  const createCampaign = useCreateCampaign();
  const addProducts = useAddCampaignProducts();

  const handleNext = () => {
    if (step === 'config') setStep('products');
    else if (step === 'products') setStep('preview');
  };

  const handleBack = () => {
    if (step === 'products') setStep('config');
    else if (step === 'preview') setStep('products');
  };

  const handleCreate = async () => {
    try {
      const campaign = await createCampaign.mutateAsync({
        name,
        description,
        markup_percentage: markupPercentage[0],
      });

      const campaignProducts = selectedProducts.map(product => {
        const currentPrice = parseFloat(product.price || product.regular_price);
        const newRegularPrice = currentPrice * (1 + markupPercentage[0] / 100);

        return {
          campaign_id: campaign.id,
          woocommerce_product_id: product.id,
          product_name: product.name,
          product_type: product.type,
          original_regular_price: parseFloat(product.regular_price),
          original_sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
          new_regular_price: Math.round(newRegularPrice * 100) / 100,
          new_sale_price: currentPrice,
          status: 'pending' as const,
          error_message: null,
          applied_at: null,
          reverted_at: null,
        };
      });

      await addProducts.mutateAsync(campaignProducts);
      onCampaignCreated(campaign.id);
      handleClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleClose = () => {
    setStep('config');
    setName('');
    setDescription('');
    setMarkupPercentage([20]);
    setSelectedProducts([]);
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === 'config') return name.trim() !== '' && markupPercentage[0] > 0;
    if (step === 'products') return selectedProducts.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nueva Campaña E-commerce
            {step === 'config' && ' - Configuración'}
            {step === 'products' && ' - Selección de Productos'}
            {step === 'preview' && ' - Vista Previa'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'config' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Campaña</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Black Friday 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción de la campaña..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Porcentaje de Aumento: {markupPercentage[0]}%</Label>
                <div className="px-2">
                  <Slider
                    value={markupPercentage}
                    onValueChange={setMarkupPercentage}
                    min={5}
                    max={100}
                    step={5}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  El precio actual se convertirá en precio de oferta, y el precio regular será {markupPercentage[0]}% más alto.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">Ejemplo:</p>
                <p className="text-sm">Si un producto cuesta $4,890:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Precio Regular: ${Math.round(4890 * (1 + markupPercentage[0] / 100))}</li>
                  <li>• Precio Oferta: $4,890</li>
                  <li>• Descuento mostrado: {Math.round((1 - 4890 / (4890 * (1 + markupPercentage[0] / 100))) * 100)}%</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'products' && (
            <CampaignProductSelector
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
            />
          )}

          {step === 'preview' && (
            <CampaignPreview
              products={selectedProducts}
              markupPercentage={markupPercentage[0]}
            />
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 'config'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Atrás
            </Button>

            {step !== 'preview' ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={createCampaign.isPending || addProducts.isPending}
              >
                {createCampaign.isPending || addProducts.isPending ? 'Creando...' : 'Crear Campaña'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
