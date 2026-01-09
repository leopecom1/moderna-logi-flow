import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  type: 'feature' | 'improvement' | 'fix' | 'announcement';
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SystemUpdateRead {
  id: string;
  user_id: string;
  update_id: string;
  read_at: string;
}

export function useSystemUpdates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all active updates
  const { data: updates = [], isLoading, refetch } = useQuery({
    queryKey: ['system-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemUpdate[];
    },
    enabled: !!user,
  });

  // Fetch read status for current user
  const { data: readUpdates = [] } = useQuery({
    queryKey: ['system-updates-read', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('system_updates_read')
        .select('update_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(r => r.update_id);
    },
    enabled: !!user,
  });

  // Get only active updates for regular users
  const activeUpdates = updates.filter(u => u.is_active);

  // Calculate unread count (only for active updates)
  const unreadCount = activeUpdates.filter(u => !readUpdates.includes(u.id)).length;

  // Mark single update as read
  const markAsRead = useMutation({
    mutationFn: async (updateId: string) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('system_updates_read')
        .upsert({
          user_id: user.id,
          update_id: updateId,
        }, {
          onConflict: 'user_id,update_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-updates-read'] });
    },
  });

  // Mark all updates as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      
      const unreadIds = activeUpdates
        .filter(u => !readUpdates.includes(u.id))
        .map(u => ({
          user_id: user.id,
          update_id: u.id,
        }));

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('system_updates_read')
        .upsert(unreadIds, {
          onConflict: 'user_id,update_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-updates-read'] });
    },
  });

  // Create new update (admin only)
  const createUpdate = useMutation({
    mutationFn: async (data: Omit<SystemUpdate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('system_updates')
        .insert({
          ...data,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-updates'] });
    },
  });

  // Update existing update (admin only)
  const updateUpdate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SystemUpdate> & { id: string }) => {
      const { error } = await supabase
        .from('system_updates')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-updates'] });
    },
  });

  // Delete update (admin only)
  const deleteUpdate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_updates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-updates'] });
    },
  });

  // Toggle update active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('system_updates')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-updates'] });
    },
  });

  return {
    updates,
    activeUpdates,
    readUpdates,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    createUpdate,
    updateUpdate,
    deleteUpdate,
    toggleActive,
    isRead: (updateId: string) => readUpdates.includes(updateId),
  };
}
