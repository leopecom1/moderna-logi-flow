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
            <Label htmlFor="store-domain">Dominio de la tienda Shopify</Label>
            <Input
              id="store-domain"
              placeholder="tu-tienda.myshopify.com"
              value={storeDomain}
              onChange={(e) => setStoreDomain(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Usa el dominio <strong>.myshopify.com</strong> de tu tienda. Encuéntralo en: 
              Shopify Admin → Settings → Domains
            </p>
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
              <strong>📋 Instrucciones para configurar Shopify:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Ve a tu admin de Shopify</li>
                <li>Settings → Apps and sales channels → Develop apps</li>
                <li>Create an app (dale un nombre)</li>
                <li>Configure Admin API scopes → selecciona <code className="bg-muted px-1">read_products</code> y <code className="bg-muted px-1">write_products</code></li>
                <li>Install app → API credentials → Reveal token once</li>
                <li>Copia el <strong>Admin API access token</strong> (empieza con "shpat_")</li>
              </ol>
              <p className="mt-3 font-semibold text-primary">
                💡 El dominio debe ser el formato .myshopify.com (ej: tu-tienda.myshopify.com)
              </p>
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
