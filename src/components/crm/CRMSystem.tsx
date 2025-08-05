import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  User, Phone, Mail, MapPin, Calendar, DollarSign, Package, Star, 
  MessageSquare, Plus, Edit, Trash2, Filter, Search, TrendingUp, Clock 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  status: 'active' | 'inactive' | 'potential';
  segment: 'premium' | 'standard' | 'basic';
  registration_date: string;
  last_order_date: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  satisfaction_score: number;
  notes: string[];
}

interface CustomerInteraction {
  id: string;
  customer_id: string;
  type: 'call' | 'email' | 'meeting' | 'order' | 'complaint' | 'feedback';
  description: string;
  date: string;
  outcome: 'positive' | 'neutral' | 'negative';
  follow_up_required: boolean;
  assigned_to: string;
}

interface CustomerMetrics {
  total_customers: number;
  new_this_month: number;
  churn_rate: number;
  avg_satisfaction: number;
  lifetime_value: number;
  retention_rate: number;
}

export const CRMSystem = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');

  useEffect(() => {
    const generateCRMData = () => {
      // Generate customer data
      const customerData: Customer[] = [
        {
          id: 'CUST-001',
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+54 11 1234-5678',
          address: 'Av. Corrientes 1234, Buenos Aires',
          company: 'Panadería San Martín',
          status: 'active',
          segment: 'premium',
          registration_date: '2024-01-15',
          last_order_date: '2024-06-01',
          total_orders: 47,
          total_spent: 23500,
          avg_order_value: 500,
          satisfaction_score: 4.8,
          notes: ['Cliente muy satisfecho', 'Pedidos regulares de productos frescos']
        },
        {
          id: 'CUST-002',
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@empresa.com',
          phone: '+54 11 9876-5432',
          address: 'Calle Florida 567, CABA',
          company: 'Restaurante El Buen Sabor',
          status: 'active',
          segment: 'standard',
          registration_date: '2024-02-20',
          last_order_date: '2024-05-28',
          total_orders: 28,
          total_spent: 14200,
          avg_order_value: 507,
          satisfaction_score: 4.5,
          notes: ['Requiere entregas tempranas', 'Pagos siempre puntuales']
        },
        {
          id: 'CUST-003',
          name: 'Ana Fernández',
          email: 'ana.fernandez@hotmail.com',
          phone: '+54 11 5555-6666',
          address: 'Barrio Norte 890, Buenos Aires',
          status: 'potential',
          segment: 'basic',
          registration_date: '2024-05-10',
          last_order_date: '2024-05-10',
          total_orders: 3,
          total_spent: 750,
          avg_order_value: 250,
          satisfaction_score: 4.2,
          notes: ['Nuevo cliente', 'Mostró interés en productos premium']
        }
      ];

      // Generate interactions
      const interactionData: CustomerInteraction[] = [
        {
          id: 'INT-001',
          customer_id: 'CUST-001',
          type: 'call',
          description: 'Consulta sobre nuevos productos disponibles',
          date: '2024-06-01T10:30:00',
          outcome: 'positive',
          follow_up_required: false,
          assigned_to: 'Juan Pérez'
        },
        {
          id: 'INT-002',
          customer_id: 'CUST-002',
          type: 'email',
          description: 'Solicitud de cambio en horario de entrega',
          date: '2024-05-28T14:15:00',
          outcome: 'positive',
          follow_up_required: true,
          assigned_to: 'María López'
        },
        {
          id: 'INT-003',
          customer_id: 'CUST-003',
          type: 'meeting',
          description: 'Reunión para discutir descuentos por volumen',
          date: '2024-05-25T16:00:00',
          outcome: 'neutral',
          follow_up_required: true,
          assigned_to: 'Carlos Mendez'
        }
      ];

      // Generate metrics
      const customerMetrics: CustomerMetrics = {
        total_customers: 847,
        new_this_month: 23,
        churn_rate: 2.3,
        avg_satisfaction: 4.6,
        lifetime_value: 1850,
        retention_rate: 94.2
      };

      setCustomers(customerData);
      setInteractions(interactionData);
      setMetrics(customerMetrics);
      setLoading(false);
    };

    generateCRMData();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const getCustomerInteractions = (customerId: string) => {
    return interactions.filter(interaction => interaction.customer_id === customerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'potential': return 'outline';
      default: return 'secondary';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateCustomer = () => {
    toast({
      title: "Cliente Creado",
      description: "El nuevo cliente ha sido agregado al sistema CRM"
    });
    setIsCreateModalOpen(false);
  };

  const handleCreateInteraction = () => {
    toast({
      title: "Interacción Registrada",
      description: "La interacción ha sido guardada en el historial del cliente"
    });
    setIsInteractionModalOpen(false);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Sistema CRM</h2>
          <p className="text-muted-foreground">
            Gestión integral de relaciones con clientes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo cliente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input placeholder="Nombre completo" />
                <Input placeholder="Email" type="email" />
                <Input placeholder="Teléfono" />
                <Input placeholder="Empresa (opcional)" />
                <Textarea placeholder="Dirección" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateCustomer}>Crear Cliente</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{metrics.total_customers}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nuevos este Mes</p>
                <p className="text-2xl font-bold">{metrics.new_this_month}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfacción</p>
                <p className="text-2xl font-bold">{metrics.avg_satisfaction}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retención</p>
                <p className="text-2xl font-bold">{metrics.retention_rate}%</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Vitalicio</p>
                <p className="text-2xl font-bold">${metrics.lifetime_value}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abandono</p>
                <p className="text-2xl font-bold">{metrics.churn_rate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="potential">Potencial</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los segmentos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="standard">Estándar</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSegmentFilter('all');
            }}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Clientes ({filteredCustomers.length})</h3>
          {filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCustomer?.id === customer.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{customer.name}</h4>
                    {customer.company && (
                      <p className="text-sm text-muted-foreground">{customer.company}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                    <Badge className={getSegmentColor(customer.segment)}>
                      {customer.segment}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{customer.total_orders} pedidos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${customer.total_spent.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{customer.satisfaction_score}/5</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Último pedido: {new Date(customer.last_order_date).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer Detail */}
        <div>
          {selectedCustomer ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedCustomer.name}</CardTitle>
                    <CardDescription>{selectedCustomer.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog open={isInteractionModalOpen} onOpenChange={setIsInteractionModalOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Nueva Interacción
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Interacción</DialogTitle>
                          <DialogDescription>
                            Registra una nueva interacción con {selectedCustomer.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de interacción" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Llamada</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Reunión</SelectItem>
                              <SelectItem value="order">Pedido</SelectItem>
                              <SelectItem value="complaint">Reclamo</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea placeholder="Descripción de la interacción" />
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Resultado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="positive">Positivo</SelectItem>
                              <SelectItem value="neutral">Neutral</SelectItem>
                              <SelectItem value="negative">Negativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateInteraction}>Registrar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="interactions">Interacciones</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Teléfono</label>
                        <p className="text-sm">{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Empresa</label>
                        <p className="text-sm">{selectedCustomer.company || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Dirección</label>
                        <p className="text-sm">{selectedCustomer.address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fecha de Registro</label>
                        <p className="text-sm">{new Date(selectedCustomer.registration_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valor Promedio Pedido</label>
                        <p className="text-sm">${selectedCustomer.avg_order_value}</p>
                      </div>
                    </div>
                    
                    {selectedCustomer.notes.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Notas</label>
                        <ul className="mt-2 space-y-1">
                          {selectedCustomer.notes.map((note, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="interactions" className="space-y-4">
                    {getCustomerInteractions(selectedCustomer.id).map((interaction) => (
                      <div key={interaction.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{interaction.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(interaction.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{interaction.description}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span>Asignado a: {interaction.assigned_to}</span>
                          <Badge 
                            variant={
                              interaction.outcome === 'positive' ? 'default' :
                              interaction.outcome === 'negative' ? 'destructive' : 'secondary'
                            }
                          >
                            {interaction.outcome}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{selectedCustomer.total_orders}</div>
                            <div className="text-sm text-muted-foreground">Total Pedidos</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">${selectedCustomer.total_spent.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total Gastado</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona un cliente para ver sus detalles
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};