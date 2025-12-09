import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';

export function useGetAllEmployees(searchQuery?: string, department?: string, status?: string) {
  return useQuery({
    queryKey: ['admin', 'employees', searchQuery, department, status],
    queryFn: async (): Promise<Employee[]> => {
      let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (department && department !== 'all') {
        query = query.eq('department', department);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (searchQuery && searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter((emp) => {
          const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
          const email = emp.email.toLowerCase();
          const empId = (emp.employee_id || '').toLowerCase();
          return (
            fullName.includes(lowerQuery) ||
            email.includes(lowerQuery) ||
            empId.includes(lowerQuery)
          );
        });
      }

      return filteredData;
    },
    staleTime: 30000,
  });
}

export function useGetEmployeeById(employeeId: string) {
  return useQuery({
    queryKey: ['admin', 'employee', employeeId],
    queryFn: async (): Promise<Employee> => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
    staleTime: 30000,
  });
}

export function useGetDepartments() {
  return useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('employees').select('department');

      if (error) throw error;

      const uniqueDepts = Array.from(new Set(data.map((emp) => emp.department))).filter(
        Boolean
      );
      return uniqueDepts.sort();
    },
    staleTime: 300000,
  });
}

export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, isActive }: { employeeId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ is_active: isActive })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employee'] });
    },
  });
}

export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  employee_id?: string;
  department: string;
  designation: string;
  join_date: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  standard_shift_start: string;
  standard_shift_end: string;
  standard_hours_per_day: number;
  is_admin: boolean;
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
    },
  });
}

export interface UpdateEmployeeInput {
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  department: string;
  designation: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  standard_shift_start: string;
  standard_shift_end: string;
  standard_hours_per_day: number;
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, input }: { employeeId: string; input: UpdateEmployeeInput }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(input)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employee'] });
    },
  });
}
