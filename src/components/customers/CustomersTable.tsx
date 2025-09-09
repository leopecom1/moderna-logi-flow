import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  departamento: string | null;
  notes: string | null;
  cedula_identidad: string | null;
  margen: number | null;
  created_at: string;
  customer_number: string | null;
  orders_count?: number;
  has_active_credit?: boolean;
  last_branch?: string;
}

interface CustomersTableProps {
  customers: Customer[];
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

export function CustomersTable({ 
  customers, 
  canManageCustomers, 
  canDeleteCustomers, 
  onEditCustomer, 
  onDeleteCustomer 
}: CustomersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Cliente</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Cant. Órdenes</TableHead>
            <TableHead>Crédito Moderna</TableHead>
            <TableHead>Última Sucursal</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                {customer.customer_number || 'N/A'}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.city}</div>
                </div>
              </TableCell>
              <TableCell>
                {customer.phone || '-'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {customer.orders_count || 0}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={customer.has_active_credit ? 'default' : 'secondary'}>
                  {customer.has_active_credit ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                {customer.last_branch || '-'}
              </TableCell>
              <TableCell>
                {customer.departamento || 'Sin depto'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManageCustomers && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditCustomer(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteCustomers && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDeleteCustomer(customer)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {customers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No se encontraron clientes</div>
        </div>
      )}
    </div>
  );
}