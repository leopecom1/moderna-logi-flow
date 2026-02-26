import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit2, Trash2, Search, Plus, ChevronRight, FolderOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWooCommerceCategories, useCreateWooCommerceCategory, useUpdateWooCommerceCategory, useDeleteWooCommerceCategory } from '@/hooks/useWooCommerceCategories';
import { WooCommerceCategory } from '@/types/woocommerce';
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

interface CategoriesWooCommerceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoryNode {
  category: WooCommerceCategory;
  children: WooCommerceCategory[];
}

export function CategoriesWooCommerceModal({ open, onOpenChange }: CategoriesWooCommerceModalProps) {
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<WooCommerceCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: 0,
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());

  const { data: categories, isLoading } = useWooCommerceCategories();
  const createMutation = useCreateWooCommerceCategory();
  const updateMutation = useUpdateWooCommerceCategory();
  const deleteMutation = useDeleteWooCommerceCategory();

  // Build tree structure
  const categoryTree = useMemo(() => {
    if (!categories) return [];
    const roots: CategoryNode[] = [];
    const childrenMap = new Map<number, WooCommerceCategory[]>();

    // Group children by parent
    for (const cat of categories as WooCommerceCategory[]) {
      if (cat.parent === 0) {
        roots.push({ category: cat, children: [] });
      } else {
        const existing = childrenMap.get(cat.parent) || [];
        existing.push(cat);
        childrenMap.set(cat.parent, existing);
      }
    }

    // Assign children to roots
    for (const node of roots) {
      node.children = childrenMap.get(node.category.id) || [];
    }

    return roots;
  }, [categories]);

  // Filtered tree based on search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return categoryTree;
    const lowerSearch = search.toLowerCase();
    return categoryTree
      .map((node) => {
        const rootMatches = node.category.name.toLowerCase().includes(lowerSearch);
        const matchingChildren = node.children.filter((c) =>
          c.name.toLowerCase().includes(lowerSearch)
        );
        if (rootMatches || matchingChildren.length > 0) {
          return {
            category: node.category,
            children: rootMatches ? node.children : matchingChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as CategoryNode[];
  }, [categoryTree, search]);

  // Root categories for the parent selector
  const rootCategories = useMemo(() => {
    if (!categories) return [];
    return (categories as WooCommerceCategory[]).filter((c) => c.parent === 0);
  }, [categories]);

  const toggleNode = (id: number) => {
    setOpenNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEdit = (category: WooCommerceCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
    });
  };

  const handleCreateSubcategory = (parentCategory: WooCommerceCategory) => {
    resetForm();
    setFormData((prev) => ({ ...prev, parent: parentCategory.id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateMutation.mutateAsync({ id: editingCategory.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', parent: 0 });
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const CategoryActions = ({ cat }: { cat: WooCommerceCategory }) => (
    <div className="flex gap-1 shrink-0">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(cat)}>
        <Edit2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(cat.id)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestión de Categorías WooCommerce</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Lista jerárquica */}
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorías..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="border rounded-lg overflow-auto flex-1 p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTree.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No se encontraron categorías</p>
                ) : (
                  filteredTree.map((node) => {
                    const hasChildren = node.children.length > 0;
                    const isOpen = openNodes.has(node.category.id);

                    if (!hasChildren) {
                      return (
                        <div
                          key={node.category.id}
                          className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm font-medium truncate block">{node.category.name}</span>
                              <span className="text-xs text-muted-foreground">{node.category.slug} · {node.category.count} productos</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs opacity-0 group-hover:opacity-100"
                              onClick={() => handleCreateSubcategory(node.category)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Sub
                            </Button>
                            <CategoryActions cat={node.category} />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Collapsible
                        key={node.category.id}
                        open={isOpen}
                        onOpenChange={() => toggleNode(node.category.id)}
                      >
                        <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 group">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-2 min-w-0 flex-1 text-left">
                              <ChevronRight
                                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                              />
                              <div className="min-w-0">
                                <span className="text-sm font-medium truncate block">{node.category.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {node.category.slug} · {node.category.count} productos · {node.children.length} sub
                                </span>
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs opacity-0 group-hover:opacity-100"
                              onClick={() => handleCreateSubcategory(node.category)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Sub
                            </Button>
                            <CategoryActions cat={node.category} />
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="ml-6 border-l pl-3 space-y-1 py-1">
                            {node.children.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-accent/50 group"
                              >
                                <div className="min-w-0">
                                  <span className="text-sm truncate block">{child.name}</span>
                                  <span className="text-xs text-muted-foreground">{child.slug} · {child.count} productos</span>
                                </div>
                                <CategoryActions cat={child} />
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </div>

            {/* Formulario */}
            <div className="border rounded-lg p-4 overflow-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: formData.slug || generateSlug(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Se generará automáticamente si se deja vacío</p>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="parent">Categoría Padre</Label>
                  <Select
                    value={formData.parent.toString()}
                    onValueChange={(value) => setFormData({ ...formData, parent: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría padre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin categoría padre (raíz)</SelectItem>
                      {rootCategories
                        .filter((cat) => (editingCategory ? cat.id !== editingCategory.id : true))
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isBusy}>
                    {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                  </Button>
                  {editingCategory && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos asociados no se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
