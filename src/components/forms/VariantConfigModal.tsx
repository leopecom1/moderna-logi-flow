import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings, Edit3 } from "lucide-react";

interface VariantType {
  id: string;
  name: string;
  is_active: boolean;
}

interface VariantValue {
  id: string;
  variant_type_id: string;
  name: string;
  is_active: boolean;
}

export function VariantConfigModal() {
  const [open, setOpen] = useState(false);
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [variantValues, setVariantValues] = useState<VariantValue[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newValueName, setNewValueName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchVariantData();
    }
  }, [open]);

  const fetchVariantData = async () => {
    try {
      setLoading(true);
      
      const [typesResponse, valuesResponse] = await Promise.all([
        supabase.from("product_variant_types").select("*").order("name"),
        supabase.from("product_variant_values").select("*").order("name")
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

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;

    try {
      const { error } = await supabase
        .from("product_variant_types")
        .insert([{ name: newTypeName.trim() }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tipo de variante creado correctamente",
      });

      setNewTypeName("");
      fetchVariantData();
    } catch (error) {
      console.error("Error creating variant type:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el tipo de variante",
        variant: "destructive",
      });
    }
  };

  const handleCreateValue = async () => {
    if (!newValueName.trim() || !selectedTypeId) return;

    try {
      const { error } = await supabase
        .from("product_variant_values")
        .insert([{ 
          variant_type_id: selectedTypeId,
          name: newValueName.trim() 
        }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Valor de variante creado correctamente",
      });

      setNewValueName("");
      fetchVariantData();
    } catch (error) {
      console.error("Error creating variant value:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el valor de variante",
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm("¿Estás seguro? Esto eliminará el tipo y todos sus valores.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("product_variant_types")
        .delete()
        .eq("id", typeId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tipo de variante eliminado correctamente",
      });

      fetchVariantData();
    } catch (error) {
      console.error("Error deleting variant type:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de variante",
        variant: "destructive",
      });
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm("¿Estás seguro de eliminar este valor?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("product_variant_values")
        .delete()
        .eq("id", valueId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Valor de variante eliminado correctamente",
      });

      fetchVariantData();
    } catch (error) {
      console.error("Error deleting variant value:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el valor de variante",
        variant: "destructive",
      });
    }
  };

  const getValuesForType = (typeId: string) => {
    return variantValues.filter(value => value.variant_type_id === typeId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Variantes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración de Variantes</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Variant Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crear Tipo de Variante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Color, Tamaño, Material..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateType()}
                />
                <Button onClick={handleCreateType} disabled={!newTypeName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Create Variant Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crear Valor de Variante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {variantTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Ej: Rojo, XL, Algodón..."
                  value={newValueName}
                  onChange={(e) => setNewValueName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateValue()}
                />
                <Button 
                  onClick={handleCreateValue} 
                  disabled={!newValueName.trim() || !selectedTypeId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Variant Types and Values */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipos y Valores Existentes</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : variantTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay tipos de variantes configurados
              </div>
            ) : (
              <div className="grid gap-4">
                {variantTypes.map((type) => {
                  const values = getValuesForType(type.id);
                  return (
                    <Card key={type.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{type.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteType(type.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {values.length === 0 ? (
                            <span className="text-sm text-muted-foreground italic">
                              Sin valores configurados
                            </span>
                          ) : (
                            values.map((value) => (
                              <div key={value.id} className="flex items-center gap-1">
                                <Badge variant="secondary">
                                  {value.name}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteValue(value.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
