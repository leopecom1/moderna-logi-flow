import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PackageOpen, Plus, Search, Edit2, Trash2, RefreshCw, Tag, Loader2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useWooCommerceProducts, useUpdateWooCommerceProduct, useDeleteWooCommerceProduct } from '@/hooks/useWooCommerceProducts';
import { useWooCommerceCategories } from '@/hooks/useWooCommerceCategories';
import { ProductWooCommerceModal } from '@/components/forms/ProductWooCommerceModal';
import { CategoriesWooCommerceModal } from '@/components/forms/CategoriesWooCommerceModal';
import { WooCommerceProduct } from '@/types/woocommerce';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function WooCommerceProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<number, Partial<WooCommerceProduct>>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  const { data, isLoading, refetch } = useWooCommerceProducts(
    page,
    20,
    search,
    categoryFilter === 'all' ? undefined : categoryFilter,
    statusFilter === 'all' ? undefined : statusFilter
  );
  
  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;
  const { data: categories } = useWooCommerceCategories();
  const updateMutation = useUpdateWooCommerceProduct();
  const deleteMutation = useDeleteWooCommerceProduct();

  const handleEdit = (product: WooCommerceProduct) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCellChange = (productId: number, field: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleSaveBulkChanges = async () => {
    const changesArray = Object.entries(pendingChanges);
    if (changesArray.length === 0) {
      toast({
        title: 'Sin cambios',
        description: 'No hay cambios pendientes para guardar',
      });
      return;
    }

    setIsSaving(true);
    setSaveProgress(0);
    const errors: string[] = [];
    let successCount = 0;
    const total = changesArray.length;

    for (let i = 0; i < changesArray.length; i++) {
      const [productId, changes] = changesArray[i];
      try {
        await updateMutation.mutateAsync({
          id: parseInt(productId),
          data: changes as any
        });
        successCount++;
      } catch (error: any) {
        console.error(`Error updating product ${productId}:`, error);
        const productName = products?.find((p: WooCommerceProduct) => p.id === parseInt(productId))?.name || productId;
        errors.push(`${productName}: ${error.message || 'Error desconocido'}`);
      }
      
      // Update progress
      setSaveProgress(((i + 1) / total) * 100);
    }
    
    setIsSaving(false);
    setPendingChanges({});
    
    if (errors.length === 0) {
      toast({
        title: 'Cambios guardados',
        description: `Se actualizaron ${successCount} productos correctamente`,
      });
    } else if (successCount > 0) {
      toast({
        title: 'Guardado parcial',
        description: `${successCount} productos actualizados. ${errors.length} fallaron: ${errors.join(', ')}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Error',
        description: `No se pudo guardar ningún producto. Errores: ${errors.join(', ')}`,
        variant: 'destructive',
      });
    }
  };

  const getCellValue = (product: WooCommerceProduct, field: string): any => {
    if (pendingChanges[product.id]?.[field] !== undefined) {
      return pendingChanges[product.id][field];
    }
    return (product as any)[field];
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleToggleStatus = async (product: WooCommerceProduct) => {
    await updateMutation.mutateAsync({
      id: product.id,
      data: {
        status: product.status === 'publish' ? 'draft' : 'publish',
      },
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Productos Online</h1>
            <p className="text-muted-foreground">
              Gestión completa de productos WooCommerce
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg mr-2">
            <Switch
              checked={bulkEditMode}
              onCheckedChange={(checked) => {
                setBulkEditMode(checked);
                if (!checked) setPendingChanges({});
              }}
              id="bulk-edit"
            />
            <Label htmlFor="bulk-edit" className="text-sm cursor-pointer">
              Edición masiva
            </Label>
          </div>
          {bulkEditMode && Object.keys(pendingChanges).length > 0 && (
            <Button 
              onClick={handleSaveBulkChanges} 
              variant="default" 
              className="mr-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar ({Object.keys(pendingChanges).length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowCategoriesModal(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Categorías
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {isSaving && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Guardando cambios...</span>
              <span>{Math.round(saveProgress)}%</span>
            </div>
            <Progress value={saveProgress} className="h-2" />
          </div>
        )}
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="publish">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Imagen</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right w-[140px]">Precio Regular</TableHead>
                  <TableHead className="text-right w-[140px]">Precio Oferta</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="w-[200px]">Categorías</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  {!bulkEditMode && <TableHead className="w-32">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product: WooCommerceProduct) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images[0] ? (
                        <img
                          src={product.images[0].src}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
                          <PackageOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.featured && (
                          <Badge variant="secondary" className="mt-1">
                            Destacado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                    <TableCell className="text-right">
                      {bulkEditMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={getCellValue(product, 'regular_price')}
                          onChange={(e) => handleCellChange(product.id, 'regular_price', e.target.value)}
                          className="w-full text-right"
                        />
                      ) : (
                        <span className="font-medium">${product.regular_price}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {bulkEditMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={getCellValue(product, 'sale_price') || ''}
                          onChange={(e) => handleCellChange(product.id, 'sale_price', e.target.value)}
                          className="w-full text-right"
                          placeholder="Sin oferta"
                        />
                      ) : (
                        product.on_sale ? (
                          <span className="text-destructive font-medium">
                            ${product.sale_price}
                          </span>
                        ) : (
                          '-'
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.stock_status === 'instock' ? 'default' : 'destructive'}>
                        {product.stock_status === 'instock' ? 'En Stock' : 'Sin Stock'}
                      </Badge>
                      {product.manage_stock && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Cant: {product.stock_quantity}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {bulkEditMode ? (
                        <Select
                          value={getCellValue(product, 'categories')?.[0]?.id?.toString() || ''}
                          onValueChange={(value) => {
                            const selectedCat = categories?.find((c: any) => c.id.toString() === value);
                            if (selectedCat) {
                              handleCellChange(product.id, 'categories', [{ id: selectedCat.id, name: selectedCat.name }]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {product.categories.slice(0, 2).map((cat) => (
                            <Badge key={cat.id} variant="outline" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))}
                          {product.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={product.status === 'publish'}
                        onCheckedChange={() => handleToggleStatus(product)}
                        disabled={bulkEditMode}
                      />
                    </TableCell>
                    {!bulkEditMode && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && products && products.length === 0 && (
          <div className="text-center py-12">
            <PackageOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No se encontraron productos. Crea tu primer producto.
            </p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear Producto
            </Button>
          </div>
        )}

        {!isLoading && products && products.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
              {Object.keys(pendingChanges).length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  • {Object.keys(pendingChanges).length} cambios pendientes
                </span>
              )}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                </PaginationItem>
                
                {page > 2 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                    </PaginationItem>
                    {page > 3 && <PaginationEllipsis />}
                  </>
                )}
                
                {page > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(page - 1)}>
                      {page - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationLink isActive>{page}</PaginationLink>
                </PaginationItem>
                
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(page + 1)}>
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <ProductWooCommerceModal
        open={showProductModal}
        onOpenChange={setShowProductModal}
        product={selectedProduct}
      />

      <CategoriesWooCommerceModal
        open={showCategoriesModal}
        onOpenChange={setShowCategoriesModal}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente de WooCommerce.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
