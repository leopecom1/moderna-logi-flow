import { useState, useEffect } from 'react';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WooCommerceAttribute, WooCommerceVariation, WooCommerceVariationCreate } from '@/types/woocommerce';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface WooCommerceVariationsManagerProps {
  productId?: number;
  attributes: WooCommerceAttribute[];
  variations: WooCommerceVariationCreate[];
  onAttributesChange: (attributes: WooCommerceAttribute[]) => void;
  onVariationsChange: (variations: WooCommerceVariationCreate[]) => void;
}

export function WooCommerceVariationsManager({
  attributes,
  variations,
  onAttributesChange,
  onVariationsChange,
}: WooCommerceVariationsManagerProps) {
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeOptions, setNewAttributeOptions] = useState('');

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
    onVariationsChange(combinations);
  };

  const updateVariation = (index: number, field: string, value: any) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value,
    };
    onVariationsChange(updatedVariations);
  };

  const removeVariation = (index: number) => {
    onVariationsChange(variations.filter((_, i) => i !== index));
  };

  const getVariationLabel = (variation: WooCommerceVariationCreate) => {
    return variation.attributes
      .map(attr => `${attr.name}: ${attr.option}`)
      .join(' | ');
  };

  return (
    <div className="space-y-6">
      {/* Attributes Section */}
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
            <Button onClick={generateVariations} variant="outline" className="w-full">
              Generar todas las combinaciones ({attributes.reduce((acc, attr) => acc * attr.options.length, 1)} variantes)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Variations Section */}
      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variantes Generadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configura precio y stock para cada variante
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {variations.map((variation, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{getVariationLabel(variation)}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariation(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
    </div>
  );
}
