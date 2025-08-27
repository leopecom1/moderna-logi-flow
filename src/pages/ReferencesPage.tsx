import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageLoading } from "@/components/ui/message-loading";
import { Copy, Hash, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  reference_number: number;
  parent_id?: string;
}

interface Brand {
  id: string;
  name: string;
  reference_number: number;
}

export default function ReferencesPage() {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-references"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, reference_number, parent_id")
        .eq("is_active", true)
        .order("reference_number");
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["brands-references"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, reference_number")
        .eq("is_active", true)
        .order("reference_number");
      
      if (error) throw error;
      return data as Brand[];
    },
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `Número de referencia de ${type} copiado al portapapeles`,
    });
  };

  const groupedCategories = React.useMemo(() => {
    if (!categories) return { main: [], sub: [] };
    
    const main = categories.filter(cat => !cat.parent_id);
    const sub = categories.filter(cat => cat.parent_id);
    
    return { main, sub };
  }, [categories]);

  if (categoriesLoading || brandsLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <MessageLoading />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Referencias para Importación</h1>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="font-medium mb-2">💡 Cómo usar estas referencias:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>En las <strong>columnas de categoría y marca</strong> del Excel puedes usar:</li>
            <li className="ml-4">• El <strong>número de referencia</strong> (ejemplo: 1, 2, 3...)</li>
            <li className="ml-4">• O el <strong>nombre completo</strong> (ejemplo: "Electrónicos", "Samsung")</li>
            <li>Los números son más rápidos de escribir y evitan errores de escritura</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categorías */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Categorías
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {categories?.length || 0} categorías disponibles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categorías principales */}
              <div>
                <h4 className="font-medium mb-3 text-sm">Categorías Principales</h4>
                <div className="space-y-2">
                  {groupedCategories.main.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-sm min-w-[3rem] justify-center">
                          {category.reference_number}
                        </Badge>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(category.reference_number.toString(), 'categoría')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcategorías */}
              {groupedCategories.sub.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-sm">Subcategorías</h4>
                  <div className="space-y-2">
                    {groupedCategories.sub.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg ml-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-sm min-w-[3rem] justify-center">
                            {category.reference_number}
                          </Badge>
                          <span className="text-sm">└ {category.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(category.reference_number.toString(), 'subcategoría')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marcas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Marcas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {brands?.length || 0} marcas disponibles
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brands?.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-sm min-w-[3rem] justify-center">
                        {brand.reference_number}
                      </Badge>
                      <span className="font-medium">{brand.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(brand.reference_number.toString(), 'marca')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ejemplo de uso */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Ejemplo de uso en Excel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border border-border p-2 text-left">nombre</th>
                    <th className="border border-border p-2 text-left">costo</th>
                    <th className="border border-border p-2 text-left">categoria</th>
                    <th className="border border-border p-2 text-left">marca</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-2">Smartphone Galaxy A54</td>
                    <td className="border border-border p-2">25000</td>
                    <td className="border border-border p-2 font-mono bg-yellow-50">3</td>
                    <td className="border border-border p-2 font-mono bg-yellow-50">1</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2">Auriculares Bluetooth</td>
                    <td className="border border-border p-2">5500</td>
                    <td className="border border-border p-2">Electrónicos</td>
                    <td className="border border-border p-2">Sony</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-green-700 mt-3">
              ✅ Puedes usar números de referencia (3, 1) o nombres completos (Electrónicos, Sony)
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}