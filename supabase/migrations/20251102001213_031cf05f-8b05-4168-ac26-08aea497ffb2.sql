-- Add assembly-related fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requiere_armado boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_fecha date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_horario text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_contacto_nombre text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_contacto_telefono text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_estado text DEFAULT 'pendiente' CHECK (armado_estado IN ('pendiente', 'confirmado', 'en_progreso', 'completado'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_confirmado_por uuid REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_confirmado_at timestamp with time zone;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armado_completado_at timestamp with time zone;

-- Create table for assembly photos
CREATE TABLE IF NOT EXISTS assembly_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('progreso', 'completado')),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS on assembly_photos
ALTER TABLE assembly_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for assembly_photos
CREATE POLICY "Authenticated users can view assembly photos"
  ON assembly_photos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload assembly photos"
  ON assembly_photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Create storage bucket for assembly photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('assembly-photos', 'assembly-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assembly photos
CREATE POLICY "Anyone can view assembly photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assembly-photos');

CREATE POLICY "Authenticated users can upload assembly photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assembly-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own assembly photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'assembly-photos' AND auth.uid() IS NOT NULL);