import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  MapPin
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();

  const getGerenciaDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Gerencia</h1>
          <p className="text-muted-foreground">Resumen general del sistema logístico</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,156</div>
            <p className="text-xs text-muted-foreground">94% tasa de éxito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cadetes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 nuevos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">-3 desde ayer</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Entrega completada</p>
                  <p className="text-xs text-muted-foreground">Pedido #1234 - Juan Pérez</p>
                </div>
                <span className="text-xs text-muted-foreground">hace 5 min</span>
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo pedido creado</p>
                  <p className="text-xs text-muted-foreground">Pedido #1235 - María López</p>
                </div>
                <span className="text-xs text-muted-foreground">hace 12 min</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Incidencia reportada</p>
                  <p className="text-xs text-muted-foreground">Dirección incorrecta</p>
                </div>
                <span className="text-xs text-muted-foreground">hace 25 min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hoy</span>
                <span className="text-sm font-bold">$12,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Esta semana</span>
                <span className="text-sm font-bold">$89,320</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Este mes</span>
                <span className="text-sm font-bold">$245,680</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+15% vs mes anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getVendedorDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Vendedor</h1>
          <p className="text-muted-foreground">Gestiona tus pedidos y clientes</p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Pedidos Hoy</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">+3 desde ayer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,420</div>
            <p className="text-xs text-muted-foreground">Meta: $4,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 nuevos</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#1234 - Juan Pérez</p>
                  <p className="text-sm text-muted-foreground">Zona Norte - $340</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Entregado
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#1235 - María López</p>
                  <p className="text-sm text-muted-foreground">Zona Centro - $280</p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  En ruta
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#1236 - Carlos García</p>
                  <p className="text-sm text-muted-foreground">Zona Sur - $520</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Pendiente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Crear Nuevo Pedido</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Gestionar Clientes</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Reportar Incidencia</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getCadeteDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Cadete</h1>
          <p className="text-muted-foreground">Tu ruta de entregas de hoy</p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Asignadas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Para hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">63% completado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Restantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kilómetros</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5</div>
            <p className="text-xs text-muted-foreground">km recorridos</p>
          </CardContent>
        </Card>
      </div>

      {/* Route Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">#1237 - Ana Martínez</p>
                  <p className="text-sm text-muted-foreground">Av. San Martín 1234 - Zona Norte</p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  En ruta
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">#1238 - Pedro Rodríguez</p>
                  <p className="text-sm text-muted-foreground">Calle Mitre 567 - Zona Centro</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Pendiente
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">#1239 - Laura Fernández</p>
                  <p className="text-sm text-muted-foreground">Bv. Pellegrini 890 - Zona Sur</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Pendiente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Ver Ruta Completa</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Marcar Entrega</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Reportar Problema</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getDashboard = () => {
    switch (profile?.role) {
      case 'gerencia':
        return getGerenciaDashboard();
      case 'vendedor':
        return getVendedorDashboard();
      case 'cadete':
        return getCadeteDashboard();
      default:
        return <div>Rol no reconocido</div>;
    }
  };

  return (
    <div className="container mx-auto">
      {getDashboard()}
    </div>
  );
}