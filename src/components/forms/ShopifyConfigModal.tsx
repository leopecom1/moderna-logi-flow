import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveShopifyConfig } from "@/hooks/useShopifyProducts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ShopifyConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShopifyConfigModal({ open, onOpenChange }: ShopifyConfigModalProps) {
  const [storeDomain, setStoreDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const saveMutation = useSaveShopifyConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await saveMutation.mutateAsync({
      store_domain: storeDomain,
      access_token: accessToken,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>⚙️ Configurar Conexión Shopify</DialogTitle>
          <DialogDescription>
            Conecta tu tienda Shopify para sincronizar productos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-domain">Dominio de la tienda</Label>
            <Input
              id="store-domain"
              placeholder="tu-tienda.myshopify.com"
              value={storeDomain}
              onChange={(e) => setStoreDomain(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Admin API Access Token</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              required
            />
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>¿Cómo obtener el token?</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Ve a tu admin de Shopify</li>
                <li>Settings → Apps → Develop apps</li>
                <li>Create an app → Configure</li>
                <li>Selecciona read_products y write_products</li>
                <li>Install app → Reveal token</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Conectando..." : "🔌 Conectar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
