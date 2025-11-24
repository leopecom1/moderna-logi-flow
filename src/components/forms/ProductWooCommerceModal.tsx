import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus } from 'lucide-react';
import { 
  useCreateWooCommerceProduct, 
  useUpdateWooCommerceProduct, 
  useBatchCreateWooCommerceVariations 
} from '@/hooks/useWooCommerceProducts';
import { useWooCommerceCategories } from '@/hooks/useWooCommerceCategories';
import { WooCommerceProduct, WooCommerceAttribute, WooCommerceVariationCreate } from '@/types/woocommerce';
import { WooCommerceImageUpload } from './WooCommerceImageUpload';
import { WooCommerceVariationsManager } from './WooCommerceVariationsManager';
import { Badge } from '@/components/ui/badge';
import { CategoriesWooCommerceModal } from './CategoriesWooCommerceModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProductWooCommerceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: WooCommerceProduct | null;
}

export function ProductWooCommerceModal({ open, onOpenChange, product }: ProductWooCommerceModalProps) {
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'simple' as 'simple' | 'variable',
    short_description: '',
    description: '',
    sku: '',
    regular_price: '',
    sale_price: '',
    on_sale: false,
    manage_stock: false,
    stock_quantity: 0,
    stock_status: 'instock' as 'instock' | 'outofstock',
    status: 'publish' as 'publish' | 'draft',
    featured: false,
    categories: [] as number[],
    images: [] as string[],
    attributes: [] as WooCommerceAttribute[],
    variations: [] as WooCommerceVariationCreate[],
  });

  const { data: categories } = useWooCommerceCategories();
  const createMutation = useCreateWooCommerceProduct();
  const updateMutation = useUpdateWooCommerceProduct();
  const batchVariationsMutation = useBatchCreateWooCommerceVariations();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        type: product.type === 'grouped' ? 'simple' : product.type, // grouped products shown as simple
        short_description: product.short_description,
        description: product.description,
        sku: product.sku,
        regular_price: product.regular_price,
        sale_price: product.sale_price || '',
        on_sale: product.on_sale,
        manage_stock: product.manage_stock,
        stock_quantity: product.stock_quantity || 0,
        stock_status: product.stock_status,
        status: product.status,
        featured: product.featured,
        categories: product.categories.map(cat => cat.id),
        images: product.images.map(img => img.src),
        attributes: product.attributes || [],
        variations: [],
      });
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'simple',
      short_description: '',
      description: '',
      sku: '',
      regular_price: '',
      sale_price: '',
      on_sale: false,
      manage_stock: false,
      stock_quantity: 0,
      stock_status: 'instock',
      status: 'publish',
      featured: false,
      categories: [],
      images: [],
      attributes: [],
      variations: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData: any = {
      name: formData.name,
      type: formData.type,
      short_description: formData.short_description,
      description: formData.description,
      status: formData.status,
      featured: formData.featured,
      categories: formData.categories.map(id => ({ id })),
      images: formData.images.map(src => ({ src })),
    };

    // For simple products, include pricing and stock
    if (formData.type === 'simple') {
      productData.sku = formData.sku;
      productData.regular_price = formData.regular_price;
      productData.sale_price = formData.on_sale ? formData.sale_price : '';
      productData.manage_stock = formData.manage_stock;
      productData.stock_quantity = formData.manage_stock ? formData.stock_quantity : undefined;
      productData.stock_status = formData.stock_status;
    }

    // For variable products, include attributes
    if (formData.type === 'variable') {
      productData.attributes = formData.attributes;
    }

    if (product) {
      await updateMutation.mutateAsync({
        id: product.id,
        data: productData,
      });
    } else {
      const newProduct = await createMutation.mutateAsync(productData);
      
      // If variable product with variations, create them
      if (formData.type === 'variable' && formData.variations.length > 0 && newProduct?.id) {
        await batchVariationsMutation.mutateAsync({
          productId: newProduct.id,
          variations: formData.variations,
        });
      }
    }

    onOpenChange(false);
    resetForm();
  };

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleImageRemoved = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl),
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {product ? 'Editar Producto' : 'Nuevo Producto'} WooCommerce
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo de Producto</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'simple' | 'variable') => setFormData({ ...formData, type: value })}
                  disabled={!!product}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Producto Simple</SelectItem>
                    <SelectItem value="variable">Producto Variable</SelectItem>
                  </SelectContent>
                </Select>
                {product && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No se puede cambiar el tipo de un producto existente
                  </p>
                )}
              </div>

              {formData.type === 'simple' && (
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="short_description">Descripción Corta</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción Completa</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            {/* Precios e Inventario - Solo para productos simples */}
            {formData.type === 'simple' && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Precios</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regular_price">Precio Regular *</Label>
                      <Input
                        id="regular_price"
                        type="number"
                        step="0.01"
                        value={formData.regular_price}
                        onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="sale_price">Precio en Oferta</Label>
                      <Input
                        id="sale_price"
                        type="number"
                        step="0.01"
                        value={formData.sale_price}
                        onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                        disabled={!formData.on_sale}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="on_sale"
                      checked={formData.on_sale}
                      onCheckedChange={(checked) => setFormData({ ...formData, on_sale: checked })}
                    />
                    <Label htmlFor="on_sale">En Oferta</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Inventario</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="manage_stock"
                      checked={formData.manage_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, manage_stock: checked })}
                    />
                    <Label htmlFor="manage_stock">Gestionar Stock</Label>
                  </div>

                  {formData.manage_stock && (
                    <div>
                      <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stock_status"
                      checked={formData.stock_status === 'instock'}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, stock_status: checked ? 'instock' : 'outofstock' })
                      }
                    />
                    <Label htmlFor="stock_status">En Stock</Label>
                  </div>
                </div>
              </>
            )}

            {/* Variaciones - Solo para productos variables */}
            {formData.type === 'variable' && !product && (
              <WooCommerceVariationsManager
                mode="create"
                attributes={formData.attributes}
                variations={formData.variations}
                onAttributesChange={(attributes) => setFormData(prev => ({ ...prev, attributes }))}
                onVariationsChange={(variations) => setFormData(prev => ({ ...prev, variations }))}
              />
            )}

            {formData.type === 'variable' && product && (
              <WooCommerceVariationsManager
                mode="edit"
                productId={product.id}
                attributes={formData.attributes}
                variations={formData.variations}
                onAttributesChange={(attributes) => setFormData(prev => ({ ...prev, attributes }))}
                onVariationsChange={(variations) => setFormData(prev => ({ ...prev, variations }))}
              />
            )}

            {/* Categorías */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Categorías</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoriesModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Gestionar Categorías
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories?.map((category: any) => (
                  <Badge
                    key={category.id}
                    variant={formData.categories.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Imágenes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
              <p className="text-sm text-muted-foreground">
                {formData.type === 'simple' 
                  ? 'Agrega hasta 8 imágenes para tu producto. La primera será la imagen principal.'
                  : 'Imágenes del producto padre. Las variantes pueden tener sus propias imágenes.'
                }
              </p>
              <WooCommerceImageUpload
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, images: [...prev.images, url] }))}
                onImageRemoved={handleImageRemoved}
                maxFiles={8}
                existingImages={formData.images}
              />
            </div>

            {/* Estado */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estado</h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'publish'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, status: checked ? 'publish' : 'draft' })
                  }
                />
                <Label htmlFor="status">Publicado</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Destacado</Label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {product ? 'Actualizar' : 'Crear'} Producto
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CategoriesWooCommerceModal
        open={showCategoriesModal}
        onOpenChange={setShowCategoriesModal}
      />
    </>
  );
}
