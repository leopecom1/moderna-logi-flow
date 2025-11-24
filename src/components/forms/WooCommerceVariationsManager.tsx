import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WooCommerceAttribute, WooCommerceVariation, WooCommerceVariationCreate } from '@/types/woocommerce';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  useWooCommerceVariations, 
  useCreateWooCommerceVariation, 
  useUpdateWooCommerceVariation,
  useDeleteWooCommerceVariation 
} from '@/hooks/useWooCommerceProducts';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type VariationWithStatus = (WooCommerceVariationCreate | WooCommerceVariation) & {
  _status?: 'existing' | 'new' | 'modified';
  _originalData?: WooCommerceVariation;
};

interface WooCommerceVariationsManagerProps {
  productId?: number;
  mode?: 'create' | 'edit';
  attributes: WooCommerceAttribute[];
  variations: WooCommerceVariationCreate[];
  onAttributesChange: (attributes: WooCommerceAttribute[]) => void;
  onVariationsChange: (variations: WooCommerceVariationCreate[]) => void;
}

export function WooCommerceVariationsManager({
  productId,
  mode = 'create',
  attributes,
  variations,
  onAttributesChange,
  onVariationsChange,
}: WooCommerceVariationsManagerProps) {
  const { toast } = useToast();
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeOptions, setNewAttributeOptions] = useState('');
  const [variationsWithStatus, setVariationsWithStatus] = useState<VariationWithStatus[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Load existing variations in edit mode
  const { data: existingVariations, isLoading: loadingVariations } = useWooCommerceVariations(
    mode === 'edit' && productId ? productId : null
  );
  
  const createVariationMutation = useCreateWooCommerceVariation();
  const updateVariationMutation = useUpdateWooCommerceVariation();
  const deleteVariationMutation = useDeleteWooCommerceVariation();

  // Initialize variations with status tracking
  useEffect(() => {
    if (mode === 'edit' && existingVariations) {
      const withStatus: VariationWithStatus[] = existingVariations.map(v => ({
        ...v,
        _status: 'existing' as const,
        _originalData: { ...v },
      }));
      setVariationsWithStatus(withStatus);
    }
  }, [existingVariations, mode]);

  const addAttribute = () => {
    if (!newAttributeName.trim()) return;

    const options = newAttributeOptions
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (options.length === 0) return;

    const newAttribute: WooCommerceAttribute = {
      name: newAttributeName.trim(),
      options,
      visible: true,
      variation: true,
    };

    onAttributesChange([...attributes, newAttribute]);
    setNewAttributeName('');
    setNewAttributeOptions('');
  };

  const removeAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    onAttributesChange(newAttributes);
    
    // Remove variations that use this attribute
    const removedAttr = attributes[index];
    const filteredVariations = variations.filter(v => 
      !v.attributes.some(a => a.name === removedAttr.name)
    );
    onVariationsChange(filteredVariations);
  };

  const generateVariations = () => {
    if (attributes.length === 0) return;

    const combinations: WooCommerceVariationCreate[] = [];
    
    function generateCombinations(attrIndex: number, currentCombination: Array<{ name: string; option: string }>) {
      if (attrIndex === attributes.length) {
        combinations.push({
          status: 'publish',
          regular_price: '0',
          stock_status: 'instock',
          manage_stock: true,
          stock_quantity: 0,
          attributes: [...currentCombination],
        });
        return;
      }

      const attr = attributes[attrIndex];
      for (const option of attr.options) {
        generateCombinations(attrIndex + 1, [...currentCombination, { name: attr.name, option }]);
      }
    }

    generateCombinations(0, []);
    
    // Update local state with status tracking
    const withStatus = combinations.map(v => ({ 
      ...v, 
      status: 'publish' as const,
      _status: 'new' as const 
    }));
    setVariationsWithStatus(withStatus);
    
    // Update parent state (without status fields)
    onVariationsChange(combinations);
  };

  const updateVariation = (index: number, field: string, value: any) => {
    const updated = [...variationsWithStatus];
    const variation = updated[index];
    
    updated[index] = {
      ...variation,
      [field]: value,
      _status: variation._status === 'existing' ? 'modified' as const : variation._status,
    };
    
    setVariationsWithStatus(updated);
    
    // Update parent state for create mode (clean version without status fields)
    if (mode === 'create') {
      const cleanVariations = updated.map(({ _status, _originalData, ...v }) => v);
      onVariationsChange(cleanVariations as WooCommerceVariationCreate[]);
    }
  };

  const handleSaveVariation = async (index: number) => {
    if (!productId) return;
    
    const variation = variationsWithStatus[index];
    
    try {
      if (variation._status === 'new') {
        // Create new variation
        const created = await createVariationMutation.mutateAsync({
          productId,
          data: {
            status: variation.status,
            sku: variation.sku,
            regular_price: variation.regular_price,
            sale_price: variation.sale_price,
            stock_quantity: variation.stock_quantity,
            stock_status: variation.stock_status,
            manage_stock: variation.manage_stock,
            attributes: variation.attributes,
          },
        });
        
        // Update status to existing
        const updated = [...variationsWithStatus];
        updated[index] = {
          ...created,
          _status: 'existing' as const,
          _originalData: { ...created },
        };
        setVariationsWithStatus(updated);
        
        toast({
          title: "Variación creada",
          description: "La variación se ha guardado correctamente",
        });
      } else if (variation._status === 'modified' && 'id' in variation) {
        // Update existing variation
        await updateVariationMutation.mutateAsync({
          productId,
          variationId: variation.id,
          data: {
            status: variation.status,
            sku: variation.sku,
            regular_price: variation.regular_price,
            sale_price: variation.sale_price,
            stock_quantity: variation.stock_quantity,
            stock_status: variation.stock_status,
            manage_stock: variation.manage_stock,
          },
        });
        
        // Update status back to existing
        const updated = [...variationsWithStatus];
        updated[index] = {
          ...variation,
          _status: 'existing' as const,
          _originalData: { ...variation },
        };
        setVariationsWithStatus(updated);
        
        toast({
          title: "Variación actualizada",
          description: "Los cambios se han guardado correctamente",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la variación",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariation = async (index: number) => {
    const variation = variationsWithStatus[index];
    
    if (variation._status === 'new') {
      // Just remove from list if not saved yet
      const updated = variationsWithStatus.filter((_, i) => i !== index);
      setVariationsWithStatus(updated);
      if (mode === 'create') {
        const cleanVariations = updated.map(({ _status, _originalData, ...v }) => v);
        onVariationsChange(cleanVariations as WooCommerceVariationCreate[]);
      }
      return;
    }
    
    // For existing variations, show confirmation
    if ('id' in variation) {
      setDeleteConfirmId(variation.id);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !productId) return;
    
    try {
      await deleteVariationMutation.mutateAsync({
        productId,
        variationId: deleteConfirmId,
      });
      
      const updated = variationsWithStatus.filter(v => !('id' in v) || v.id !== deleteConfirmId);
      setVariationsWithStatus(updated);
      
      toast({
        title: "Variación eliminada",
        description: "La variación se ha eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la variación",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const addNewVariationToExisting = () => {
    if (attributes.length === 0) return;
    
    // Create a new variation with first option of each attribute
    const newVariation: VariationWithStatus = {
      status: 'publish' as const,
      regular_price: '0',
      stock_status: 'instock' as const,
      manage_stock: true,
      stock_quantity: 0,
      attributes: attributes.map(attr => ({
        name: attr.name,
        option: attr.options[0],
      })),
      _status: 'new' as const,
    };
    
    setVariationsWithStatus([...variationsWithStatus, newVariation]);
  };

  const getVariationLabel = (variation: WooCommerceVariationCreate | WooCommerceVariation) => {
    return variation.attributes
      .map(attr => `${attr.name}: ${attr.option}`)
      .join(' | ');
  };

  const getStatusBadge = (status?: 'existing' | 'new' | 'modified') => {
    if (!status) return null;
    
    const config = {
      existing: { label: 'Guardado', variant: 'secondary' as const },
      new: { label: 'Nueva', variant: 'default' as const },
      modified: { label: 'Modificado', variant: 'outline' as const },
    };
    
    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (mode === 'edit' && loadingVariations) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Cargando variaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Attributes Section - Only show in create mode or if editing attributes */}
      {mode === 'create' && (
        <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atributos del Producto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define los atributos (ej: Color, Talla) y sus opciones
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Atributo</Label>
              <Input
                placeholder="ej: Color, Talla"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Opciones (separadas por coma)</Label>
              <Input
                placeholder="ej: Rojo, Azul, Verde"
                value={newAttributeOptions}
                onChange={(e) => setNewAttributeOptions(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addAttribute} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Atributo
              </Button>
            </div>
          </div>

          {attributes.length > 0 && (
            <div className="space-y-3 mt-4">
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{attr.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attr.options.map((opt, optIndex) => (
                        <Badge key={optIndex} variant="secondary">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttribute(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {attributes.length > 0 && (
            <Button type="button" onClick={generateVariations} variant="outline" className="w-full">
              Generar todas las combinaciones ({attributes.reduce((acc, attr) => acc * attr.options.length, 1)} variantes)
            </Button>
          )}
        </CardContent>
      </Card>
      )}

      {/* Variations Section */}
      {variationsWithStatus.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {mode === 'edit' ? 'Variaciones del Producto' : 'Variantes Generadas'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {mode === 'edit' 
                    ? 'Edita stock y precios, agrega nuevas variaciones o elimina obsoletas'
                    : 'Configura precio y stock para cada variante'
                  }
                </p>
              </div>
              {mode === 'edit' && attributes.length > 0 && (
                <Button onClick={addNewVariationToExisting} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Variación
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {variationsWithStatus.map((variation, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{getVariationLabel(variation)}</h4>
                      {getStatusBadge(variation._status)}
                      {'id' in variation && (
                        <span className="text-xs text-muted-foreground">ID: {variation.id}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {mode === 'edit' && (variation._status === 'new' || variation._status === 'modified') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveVariation(index)}
                          disabled={createVariationMutation.isPending || updateVariationMutation.isPending}
                        >
                          {(createVariationMutation.isPending || updateVariationMutation.isPending) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Guardar
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVariation(index)}
                        disabled={deleteVariationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        placeholder="SKU único"
                        value={variation.sku || ''}
                        onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio Regular</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={variation.regular_price}
                        onChange={(e) => updateVariation(index, 'regular_price', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio Oferta</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={variation.sale_price || ''}
                        onChange={(e) => updateVariation(index, 'sale_price', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={variation.stock_quantity || 0}
                        onChange={(e) => updateVariation(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={variation.manage_stock}
                        onCheckedChange={(checked) => updateVariation(index, 'manage_stock', checked)}
                      />
                      <Label>Gestionar stock</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={variation.status === 'publish'}
                        onCheckedChange={(checked) => 
                          updateVariation(index, 'status', checked ? 'publish' : 'private')
                        }
                      />
                      <Label>Variación Activa</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado de Stock</Label>
                      <Select
                        value={variation.stock_status}
                        onValueChange={(value) => updateVariation(index, 'stock_status', value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instock">En Stock</SelectItem>
                          <SelectItem value="outofstock">Agotado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attributes display for edit mode */}
      {mode === 'edit' && attributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atributos del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="font-medium">{attr.name}:</span>
                  <div className="flex flex-wrap gap-1">
                    {attr.options.map((opt, optIndex) => (
                      <Badge key={optIndex} variant="secondary">
                        {opt}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Los atributos no se pueden editar. Crea nuevas variaciones basadas en estos atributos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar variación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente esta variación del producto en WooCommerce.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
