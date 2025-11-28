-- Add progress tracking fields to ecommerce_campaigns table
ALTER TABLE public.ecommerce_campaigns 
ADD COLUMN IF NOT EXISTS completed_products INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_products INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skipped_products INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'idle';

-- Add check constraint for processing_status
ALTER TABLE public.ecommerce_campaigns 
ADD CONSTRAINT ecommerce_campaigns_processing_status_check 
CHECK (processing_status IN ('idle', 'processing', 'completed', 'failed', 'cancelled'));