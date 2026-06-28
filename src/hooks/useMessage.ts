import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { Message, Priority, Status } from '../types';

interface PaginatedMessages {
  items: Message[]; 
  has_next: boolean; 
  has_previous: boolean;
  page: number;
  limit: number;
  skip: number;
  total: number;
  total_pages: number;
}

const fetchMessagesByStatus = async (status: Status, pageParam: number): Promise<PaginatedMessages> => {
  const response = await apiClient.get<PaginatedMessages>('/admin/requests/', {
    params: {
      status,
      page: pageParam,
      limit: 10,
    },
  });
  return response.data;
};

export const useInfiniteMessages = (status: Status, enabled = true) => {
  return useInfiniteQuery<PaginatedMessages>({
    queryKey: ['messages', status],
    queryFn: ({ pageParam = 1 }) => fetchMessagesByStatus(status, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.has_next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled,
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      priority, 
      internal_notes,
      is_spam
    }: { 
      id: string | number; 
      status?: Status; 
      priority?: Priority; 
      internal_notes?: string; 
      is_spam?: boolean;
    }) => {
      const payload: Record<string, any> = {};
      if (status !== undefined) payload.status = status;
      if (priority !== undefined) payload.priority = priority;
      if (internal_notes !== undefined) payload.internal_notes = internal_notes;
      if (is_spam !== undefined) payload.is_spam = is_spam;

      const response = await apiClient.patch<Message>(`/admin/requests/${id}/`, payload);
      return response.data;
    },

    onMutate: async (updatedVariables) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });

      const previousMessages: Record<string, any> = {};
      const statuses: Status[] = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
      
      statuses.forEach((st) => {
        previousMessages[st] = queryClient.getQueryData(['messages', st]);
      });

      let currentStatus: Status | undefined;
      let originalMessage: Message | undefined;

      statuses.forEach((st) => {
        const cachedData = previousMessages[st];
        if (cachedData?.pages) {
          cachedData.pages.forEach((page: any) => {
            const found = page.items?.find((m: any) => m.id === updatedVariables.id); 
            if (found) {
              currentStatus = st;
              originalMessage = found;
            }
          });
        }
      });

      if (originalMessage && currentStatus) {
        const optimisticMessage = { ...originalMessage, ...updatedVariables };

        if (updatedVariables.status && updatedVariables.status !== currentStatus) {
          const oldStatus = currentStatus;
          const newStatus = updatedVariables.status;

          queryClient.setQueryData(['messages', oldStatus], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                items: (page.items || []).filter((m: any) => m.id !== updatedVariables.id)
              }))
            };
          });

          queryClient.setQueryData(['messages', newStatus], (oldData: any) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) {
              return {
                pages: [{ items: [optimisticMessage], has_next: false, page: 1, total: 1, total_pages: 1 }], 
                pageParams: [1]
              };
            }
            return {
              ...oldData,
              pages: oldData.pages.map((page: any, index: number) => {
                if (index === 0) {
                  return {
                    ...page,
                    items: [optimisticMessage, ...(page.items || [])] 
                  };
                }
                return page;
              })
            };
          });
        } else {
          queryClient.setQueryData(['messages', currentStatus], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                items: (page.items || []).map((m: any) => m.id === updatedVariables.id ? optimisticMessage : m) 
              }))
            };
          });
        }
      }

      return { previousMessages };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        Object.entries(context.previousMessages).forEach(([st, cachedData]) => {
          queryClient.setQueryData(['messages', st], cachedData);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};