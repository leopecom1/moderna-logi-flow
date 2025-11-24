import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadWooCommerceImage } from '@/hooks/useWooCommerceProducts';
import { toast } from '@/hooks/use-toast';

interface WooCommerceImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: (imageUrl: string) => void;
  maxFiles?: number;
  existingImages?: string[];
}

export function WooCommerceImageUpload({ 
  onImageUploaded, 
  onImageRemoved,
  maxFiles = 1,
  existingImages = [] 
}: WooCommerceImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>(existingImages);
  const uploadMutation = useUploadWooCommerceImage();

  // Sync previews with existingImages prop
  useEffect(() => {
    setPreviews(existingImages);
  }, [existingImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        toast({
          title: 'Formato no válido',
          description: 'Solo se permiten archivos JPG, PNG y WEBP',
          variant: 'destructive',
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          title: 'Archivo muy grande',
          description: 'El tamaño máximo es 5MB',
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    if (previews.length + validFiles.length > maxFiles) {
      toast({
        title: 'Límite excedido',
        description: `Solo puedes subir hasta ${maxFiles} ${maxFiles === 1 ? 'imagen' : 'imágenes'}`,
        variant: 'destructive',
      });
      return;
    }

    for (const file of validFiles) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);

      // Upload to WooCommerce
      try {
        const result = await uploadMutation.mutateAsync(file);
        onImageUploaded(result.source_url);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const removeImage = (index: number) => {
    const imageUrl = previews[index];
    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (onImageRemoved && imageUrl) {
      onImageRemoved(imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
        `}
      >
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          multiple={maxFiles > 1}
          onChange={handleFileInput}
          disabled={uploadMutation.isPending}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            {uploadMutation.isPending ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Click para subir</span> o arrastra y suelta
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG o WEBP (máx. 5MB)
            </p>
          </div>
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
