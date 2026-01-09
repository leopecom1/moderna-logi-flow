-- Create system_updates table for storing system announcements/news
CREATE TABLE public.system_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('feature', 'improvement', 'fix', 'announcement')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_updates_read table for tracking which updates users have read
CREATE TABLE public.system_updates_read (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  update_id UUID NOT NULL REFERENCES public.system_updates(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, update_id)
);

-- Enable RLS on both tables
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_updates_read ENABLE ROW LEVEL SECURITY;

-- Policies for system_updates
CREATE POLICY "Authenticated users can view active updates"
ON public.system_updates
FOR SELECT
USING (is_active = true OR get_user_role(auth.uid()) = 'gerencia'::user_role);

CREATE POLICY "Gerencia can create updates"
ON public.system_updates
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'gerencia'::user_role);

CREATE POLICY "Gerencia can update updates"
ON public.system_updates
FOR UPDATE
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

CREATE POLICY "Gerencia can delete updates"
ON public.system_updates
FOR DELETE
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Policies for system_updates_read
CREATE POLICY "Users can view their own read status"
ON public.system_updates_read
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark updates as read"
ON public.system_updates_read
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_system_updates_updated_at
BEFORE UPDATE ON public.system_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();