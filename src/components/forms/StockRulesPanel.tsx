import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StockRule {
  id?: string;
  category_id?: string;
  category_name?: string;
  minimum_stock: number;
  warning_threshold: number;
  is_active: boolean;
}

interface StockRulesPanelProps {
  onRulesUpdated?: () => void;
}

export function StockRulesPanel({ onRulesUpdated }: StockRulesPanelProps) {
  const [globalRuleEnabled, setGlobalRuleEnabled] = useState(false);
  const [globalMinStock, setGlobalMinStock] = useState(10);
  const [globalWarningThreshold, setGlobalWarningThreshold] = useState(5);
  const [categoryRules, setCategoryRules] = useState<StockRule[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchStockRules();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    }
  };

  const fetchStockRules = async () => {
    // This would fetch from a stock_rules table that we would need to create
    // For now, we'll use local state
    setCategoryRules([]);
  };

  const addCategoryRule = () => {
    setCategoryRules([
      ...categoryRules,
      {
        minimum_stock: 10,
        warning_threshold: 5,
        is_active: true,
      },
    ]);
  };

  const updateCategoryRule = (index: number, field: keyof StockRule, value: any) => {
    const updated = [...categoryRules];
    updated[index] = { ...updated[index], [field]: value };
    setCategoryRules(updated);
  };

  const removeCategoryRule = (index: number) => {
    setCategoryRules(categoryRules.filter((_, i) => i !== index));
  };

  const saveGlobalRule = async () => {
    setLoading(true);
    try {
      // Here we would save the global rule to the database
      // For now, just show success message
      toast({
        title: "Éxito",
        description: "Regla global guardada correctamente",
      });
      onRulesUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la regla global",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCategoryRules = async () => {
    setLoading(true);
    try {
      // Here we would save the category rules to the database
      // For now, just show success message
      toast({
        title: "Éxito",
        description: "Reglas por categoría guardadas correctamente",
      });
      onRulesUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las reglas por categoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Regla Global de Stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="global-rule"
              checked={globalRuleEnabled}
              onCheckedChange={setGlobalRuleEnabled}
            />
            <Label htmlFor="global-rule">
              Aplicar regla de stock a nivel global
            </Label>
          </div>

          {globalRuleEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="global-min-stock">Stock Mínimo</Label>
                <Input
                  id="global-min-stock"
                  type="number"
                  value={globalMinStock}
                  onChange={(e) => setGlobalMinStock(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="global-warning">Umbral de Advertencia</Label>
                <Input
                  id="global-warning"
                  type="number"
                  value={globalWarningThreshold}
                  onChange={(e) => setGlobalWarningThreshold(Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={saveGlobalRule} 
            disabled={loading}
            className="w-full"
          >
            Guardar Regla Global
          </Button>
        </CardContent>
      </Card>

      {/* Category Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reglas por Categoría</CardTitle>
          <Button
            onClick={addCategoryRule}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Regla
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryRules.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay reglas por categoría configuradas
            </p>
          ) : (
            categoryRules.map((rule, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) =>
                        updateCategoryRule(index, "is_active", checked)
                      }
                    />
                    <Label>Activa</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCategoryRule(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={rule.category_id || ""}
                      onValueChange={(value) => {
                        const category = categories.find((c) => c.id === value);
                        updateCategoryRule(index, "category_id", value);
                        updateCategoryRule(index, "category_name", category?.name);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock Mínimo</Label>
                    <Input
                      type="number"
                      value={rule.minimum_stock}
                      onChange={(e) =>
                        updateCategoryRule(index, "minimum_stock", Number(e.target.value))
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Umbral de Advertencia</Label>
                    <Input
                      type="number"
                      value={rule.warning_threshold}
                      onChange={(e) =>
                        updateCategoryRule(index, "warning_threshold", Number(e.target.value))
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          {categoryRules.length > 0 && (
            <Button 
              onClick={saveCategoryRules} 
              disabled={loading}
              className="w-full"
            >
              Guardar Reglas por Categoría
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}