import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';

interface UnclosedCashRegister {
  id: string;
  name: string;
  branch_name?: string;
}

export function CashClosureAlert() {
  const [unclosedRegisters, setUnclosedRegisters] = useState<UnclosedCashRegister[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUnclosedCashRegisters();
  }, []);

  const checkUnclosedCashRegisters = async () => {
    try {
      // Verificar si es después de las 17h en Uruguay
      const uruguayTime = formatInTimeZone(new Date(), 'America/Montevideo', 'HH:mm');
      const hour = parseInt(uruguayTime.split(':')[0]);
      
      if (hour < 17) {
        setLoading(false);
        return;
      }

      // Obtener todas las cajas registradoras activas
      const { data: registersData, error: registersError } = await supabase
        .from('branch_cash_registers')
        .select('*')
        .eq('is_active', true);

      if (registersError) throw registersError;

      // Verificar cuáles no tienen cierre para hoy
      const today = new Date().toISOString().split('T')[0];
      const { data: closuresData, error: closuresError } = await supabase
        .from('daily_cash_closures')
        .select('cash_register_id')
        .eq('closure_date', today);

      if (closuresError) throw closuresError;

      const closedRegisterIds = closuresData?.map(c => c.cash_register_id) || [];
      const unclosed = registersData?.filter(r => !closedRegisterIds.includes(r.id)) || [];

      if (unclosed.length > 0) {
        // Obtener nombres de sucursales
        const branchIds = unclosed.map(r => r.branch_id);
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name')
          .in('id', branchIds);

        const unclosedWithBranches = unclosed.map(register => ({
          id: register.id,
          name: register.name,
          branch_name: branchesData?.find(b => b.id === register.branch_id)?.name
        }));

        setUnclosedRegisters(unclosedWithBranches);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error checking unclosed cash registers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !showAlert || unclosedRegisters.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        ¡Atención! Cajas sin cerrar después de las 17:00h
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Las siguientes cajas registradoras no han sido cerradas hoy y es después de las 17:00h Uruguay:
        </p>
        <div className="space-y-2 mb-4">
          {unclosedRegisters.map((register) => (
            <div key={register.id} className="flex items-center justify-between bg-background/50 p-2 rounded">
              <span>
                <strong>{register.name}</strong>
                {register.branch_name && (
                  <span className="text-muted-foreground ml-2">({register.branch_name})</span>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/cash-management" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Ir a Gestión de Cajas
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAlert(false)}
          >
            Ocultar Aviso
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}