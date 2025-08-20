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
        return [{
          id: Math.random().toString(36).substr(2, 9),
          values: { ...currentCombination },
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {combinations.map((combination) => (
                <div key={combination.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{getDisplayName(combination)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">SKU:</Label>
                    <Input
                      placeholder="SKU opcional"
                      value={combination.sku || ""}
                      onChange={(e) => updateCombination(combination.id, "sku", e.target.value)}
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Ajuste $:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={combination.priceAdjustment}
                      onChange={(e) => updateCombination(combination.id, "priceAdjustment", parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </div>
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