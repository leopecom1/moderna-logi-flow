import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Branch {
  id: string;
  name: string;
}

interface CashRegisterConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashRegisterConfigModal({ open, onOpenChange }: CashRegisterConfigModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [config, setConfig] = useState({
    default_opening_amount: '',
    allow_send_to_central: false,
    require_manager_approval_for_send: true,
    max_petty_cash_expense: ''
  });

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  useEffect(() => {
    if (selectedBranch) {
      fetchConfig();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales",
        variant: "destructive",
      });
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_register_config')
        .select('*')
        .eq('branch_id', selectedBranch)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig({
          default_opening_amount: data.default_opening_amount.toString(),
          allow_send_to_central: data.allow_send_to_central,
          require_manager_approval_for_send: data.require_manager_approval_for_send,
          max_petty_cash_expense: data.max_petty_cash_expense.toString()
        });
      } else {
        // Reset to defaults if no config exists
        setConfig({
          default_opening_amount: '0',
          allow_send_to_central: false,
          require_manager_approval_for_send: true,
          max_petty_cash_expense: '1000'
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) {
      toast({
        title: "Error",
        description: "Selecciona una sucursal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cash_register_config')
        .upsert({
          branch_id: selectedBranch,
          default_opening_amount: parseFloat(config.default_opening_amount) || 0,
          allow_send_to_central: config.allow_send_to_central,
          require_manager_approval_for_send: config.require_manager_approval_for_send,
          max_petty_cash_expense: parseFloat(config.max_petty_cash_expense) || 1000
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración guardada exitosamente",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuración de Cajas</DialogTitle>
          <DialogDescription>
            Configura los parámetros para las cajas registradoras
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="branch">Sucursal</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBranch && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_opening_amount">Monto de Apertura por Defecto</Label>
                  <Input
                    id="default_opening_amount"
                    type="number"
                    step="0.01"
                    value={config.default_opening_amount}
                    onChange={(e) => setConfig({ ...config, default_opening_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_petty_cash_expense">Máximo Gasto de Caja Chica</Label>
                  <Input
                    id="max_petty_cash_expense"
                    type="number"
                    step="0.01"
                    value={config.max_petty_cash_expense}
                    onChange={(e) => setConfig({ ...config, max_petty_cash_expense: e.target.value })}
                    placeholder="1000.00"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Envío a Central</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite enviar dinero a caja central
                    </p>
                  </div>
                  <Switch
                    checked={config.allow_send_to_central}
                    onCheckedChange={(checked) => setConfig({ ...config, allow_send_to_central: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requerir Aprobación Gerencial</Label>
                    <p className="text-sm text-muted-foreground">
                      Requiere aprobación para envíos a central
                    </p>
                  </div>
                  <Switch
                    checked={config.require_manager_approval_for_send}
                    onCheckedChange={(checked) => setConfig({ ...config, require_manager_approval_for_send: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedBranch}>
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}