-- Create user_feedback table
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'suggestion' CHECK (type IN ('suggestion', 'bug', 'question', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  created_by UUID NOT NULL,
  completed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all feedbacks (transparency)
CREATE POLICY "Authenticated users can view all feedbacks"
  ON public.user_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can create feedbacks
CREATE POLICY "Authenticated users can create feedbacks"
  ON public.user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only gerencia can update feedbacks
CREATE POLICY "Gerencia can update feedbacks"
  ON public.user_feedback
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'gerencia');

-- Only gerencia can delete feedbacks
CREATE POLICY "Gerencia can delete feedbacks"
  ON public.user_feedback
  FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'gerencia');

-- Create trigger for updated_at
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();