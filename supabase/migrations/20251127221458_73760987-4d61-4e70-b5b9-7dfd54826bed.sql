-- Create table for sync jobs
CREATE TABLE public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  total_products INTEGER NOT NULL DEFAULT 0,
  completed_products INTEGER NOT NULL DEFAULT 0,
  failed_products INTEGER NOT NULL DEFAULT 0,
  copy_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for sync job items
CREATE TABLE public.sync_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
  woocommerce_product_id INTEGER NOT NULL,
  woocommerce_product_name TEXT NOT NULL,
  shopify_product_id BIGINT NOT NULL,
  shopify_product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_job_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sync_jobs
CREATE POLICY "Authenticated users can view sync jobs"
  ON public.sync_jobs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sync jobs"
  ON public.sync_jobs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own sync jobs"
  ON public.sync_jobs
  FOR UPDATE
  USING (created_by = auth.uid() OR get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for sync_job_items
CREATE POLICY "Authenticated users can view sync job items"
  ON public.sync_job_items
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sync job items"
  ON public.sync_job_items
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update sync job items"
  ON public.sync_job_items
  FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_by ON public.sync_jobs(created_by);
CREATE INDEX idx_sync_job_items_job_id ON public.sync_job_items(job_id);
CREATE INDEX idx_sync_job_items_status ON public.sync_job_items(status);

-- Create trigger for updated_at
CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();