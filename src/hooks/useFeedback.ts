import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FeedbackType = 'suggestion' | 'bug' | 'question' | 'other';
export type FeedbackStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export interface Feedback {
  id: string;
  title: string;
  content: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  created_by: string;
  completed_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackData {
  title: string;
  content: string;
  type: FeedbackType;
}

export interface UpdateFeedbackData {
  id: string;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  admin_notes?: string;
  completed_by?: string;
}

export const useFeedback = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const feedbacksQuery = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
    enabled: !!user,
  });

  const pendingCount = feedbacksQuery.data?.filter(f => f.status === 'pending').length || 0;
  const myFeedbacks = feedbacksQuery.data?.filter(f => f.created_by === user?.id) || [];

  const createFeedback = useMutation({
    mutationFn: async (data: CreateFeedbackData) => {
      if (!user) throw new Error('No autenticado');
      
      const { data: result, error } = await supabase
        .from('user_feedback')
        .insert({
          title: data.title,
          content: data.content,
          type: data.type,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Feedback enviado correctamente');
    },
    onError: (error) => {
      toast.error('Error al enviar feedback: ' + error.message);
    },
  });

  const updateFeedback = useMutation({
    mutationFn: async (data: UpdateFeedbackData) => {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('user_feedback')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Feedback actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const markAsCompleted = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No autenticado');
      
      const { data: result, error } = await supabase
        .from('user_feedback')
        .update({ 
          status: 'completed' as FeedbackStatus,
          completed_by: user.id 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Feedback marcado como completado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Feedback eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  return {
    feedbacks: feedbacksQuery.data || [],
    myFeedbacks,
    pendingCount,
    isLoading: feedbacksQuery.isLoading,
    createFeedback,
    updateFeedback,
    markAsCompleted,
    deleteFeedback,
  };
};
