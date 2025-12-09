import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LeaveRequest } from '@/types';

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    employee_id: string | null;
  };
}

export function useGetAllLeaveRequests(
  typeFilter?: string,
  statusFilter?: string,
  searchQuery?: string
) {
  return useQuery({
    queryKey: ['admin', 'leave-requests', typeFilter, statusFilter, searchQuery],
    queryFn: async (): Promise<LeaveRequestWithEmployee[]> => {
      let query = supabase
        .from('leave_requests')
        .select(
          `
          *,
          employee:employees(id, first_name, last_name, email, department, employee_id)
        `
        )
        .order('created_at', { ascending: false });

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('leave_type', typeFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = (data || []) as LeaveRequestWithEmployee[];

      if (searchQuery && searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        results = results.filter((req) => {
          const fullName = `${req.employee.first_name} ${req.employee.last_name}`.toLowerCase();
          const empId = (req.employee.employee_id || '').toLowerCase();
          return fullName.includes(lowerQuery) || empId.includes(lowerQuery);
        });
      }

      return results;
    },
    staleTime: 30000,
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      adminComment,
    }: {
      requestId: string;
      adminComment?: string;
    }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approver_comment: adminComment || null,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      adminComment,
    }: {
      requestId: string;
      adminComment?: string;
    }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approver_comment: adminComment || null,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}
