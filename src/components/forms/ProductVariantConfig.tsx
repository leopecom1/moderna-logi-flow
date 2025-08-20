import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";

interface VariantType {
  id: string;
  name: string;
}

interface VariantValue {
  id: string;
  variant_type_id: string;
  name: string;
}

interface VariantCombination {
  id: string;
  values: { [typeId: string]: string }; // typeId -> valueId
  sku?: string;
  priceAdjustment: number;
}

interface ProductVariantConfigProps {
  productId?: string;
  onVariantsChange?: (variants: VariantCombination[]) => void;
  isCreating?: boolean;
}

export function ProductVariantConfig({ 
  productId, 
  onVariantsChange, 
  isCreating = false 
}: ProductVariantConfigProps) {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [variantValues, setVariantValues] = useState<VariantValue[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVariantData();
  }, []);

  useEffect(() => {
    if (selectedTypes.length > 0) {
      generateCombinations();
    } else {
      setCombinations([]);
    }
  }, [selectedTypes, variantValues]);

  useEffect(() => {
    onVariantsChange?.(combinations);
  }, [combinations, onVariantsChange]);

  const fetchVariantData = async () => {
    try {
      setLoading(true);
      
      const [typesResponse, valuesResponse] = await Promise.all([
        supabase.from("product_variant_types").select("*").eq("is_active", true).order("name"),
        supabase.from("product_variant_values").select("*").eq("is_active", true).order("name")
      ]);

      if (typesResponse.error) throw typesResponse.error;
      if (valuesResponse.error) throw valuesResponse.error;

      setVariantTypes(typesResponse.data || []);
      setVariantValues(valuesResponse.data || []);
    } catch (error) {
      console.error("Error fetching variant data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las variantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCombinations = () => {
    if (selectedTypes.length === 0) {
      setCombinations([]);
      return;
    }

    // Get values for each selected type
    const typeValues = selectedTypes.map(typeId => ({
      typeId,
      values: variantValues.filter(v => v.variant_type_id === typeId)
    }));

    // Generate all combinations
    const generateRecursive = (typeIndex: number, currentCombination: { [key: string]: string }): VariantCombination[] => {
      if (typeIndex >= typeValues.length) {
        const displayName = Object.entries(currentCombination).map(([typeId, valueId]) => {
          const value = variantValues.find(v => v.id === valueId);
          return value?.name || '';
        }).join('-');

        return [{
          id: Math.random().toString(36).substr(2, 9),
          values: { ...currentCombination },
          sku: generateSKU(displayName),
          priceAdjustment: 0
        }];
      }

      const currentType = typeValues[typeIndex];
      const result: VariantCombination[] = [];

      for (const value of currentType.values) {
        const newCombination = {
          ...currentCombination,
          [currentType.typeId]: value.id
        };
        result.push(...generateRecursive(typeIndex + 1, newCombination));
      }

      return result;
    };

    const newCombinations = generateRecursive(0, {});
    setCombinations(newCombinations);
  };

  const generateSKU = (variantName: string) => {
    // This will be implemented when we have access to product data
    // For now, return a placeholder
    return `XX-PROD-${variantName.toUpperCase()}`;
  };

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const updateCombination = (combinationId: string, field: keyof VariantCombination, value: any) => {
    setCombinations(prev => prev.map(combo => 
      combo.id === combinationId 
        ? { ...combo, [field]: value }
        : combo
    ));
  };

  const getDisplayName = (combination: VariantCombination) => {
    return Object.entries(combination.values).map(([typeId, valueId]) => {
      const type = variantTypes.find(t => t.id === typeId);
      const value = variantValues.find(v => v.id === valueId);
      return `${type?.name}: ${value?.name}`;
    }).join(" | ");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (variantTypes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay tipos de variantes configurados</h3>
          <p className="text-muted-foreground text-center mb-4">
            Necesitas configurar tipos de variantes antes de crear variantes de producto
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Select Variant Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Tipos de Variantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variantTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.id);
              const hasValues = variantValues.some(v => v.variant_type_id === type.id);
              
              return (
                <Badge
                  key={type.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer ${!hasValues ? "opacity-50" : ""}`}
                  onClick={() => hasValues && handleTypeToggle(type.id)}
                >
                  {type.name}
                  {!hasValues && " (sin valores)"}
                </Badge>
              );
            })}
          </div>
          {selectedTypes.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Selecciona los tipos de variantes que aplicarán a este producto
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Combinations */}
      {combinations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Combinaciones de Variantes ({combinations.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Haz clic en una combinación para configurar sus detalles específicos
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {combinations.map((combination) => (
                <Badge
                  key={combination.id}
                  variant={selectedCombination === combination.id ? "default" : "outline"}
                  className="cursor-pointer p-2 text-sm"
                  onClick={() => setSelectedCombination(
                    selectedCombination === combination.id ? null : combination.id
                  )}
                >
                  {getDisplayName(combination)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Combination Configuration */}
      {selectedCombination && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Configurar Variante: {getDisplayName(combinations.find(c => c.id === selectedCombination)!)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const combination = combinations.find(c => c.id === selectedCombination);
              if (!combination) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">SKU</Label>
                      <Input
                        placeholder="SKU generado automáticamente"
                        value={combination.sku || ""}
                        onChange={(e) => updateCombination(combination.id, "sku", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Se genera automáticamente si se deja vacío
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Ajuste de Precio ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={combination.priceAdjustment}
                        onChange={(e) => updateCombination(combination.id, "priceAdjustment", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Ajuste sobre el precio base del producto
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {selectedTypes.length > 0 && combinations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              No se pueden generar combinaciones. Verifica que los tipos seleccionados tengan valores configurados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}