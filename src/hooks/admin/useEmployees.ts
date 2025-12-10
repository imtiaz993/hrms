import { Employee } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { useLocalData } from '@/lib/local-data';

export function useGetAllEmployees(searchQuery?: string, department?: string, status?: string) {
  const { employees } = useLocalData();
  const [data, setData] = useState<Employee[]>([]);

  useEffect(() => {
    let results = [...employees].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

      if (status === 'active') {
      results = results.filter((emp) => emp.is_active);
      } else if (status === 'inactive') {
      results = results.filter((emp) => !emp.is_active);
      }

      if (department && department !== 'all') {
      results = results.filter((emp) => emp.department === department);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
      results = results.filter((emp) => {
          const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
          const email = emp.email.toLowerCase();
          const empId = (emp.employee_id || '').toLowerCase();
        return fullName.includes(lowerQuery) || email.includes(lowerQuery) || empId.includes(lowerQuery);
        });
      }

    setData(results);
  }, [employees, searchQuery, department, status]);

  return { data, isLoading: false, error: null as unknown };
}

export function useGetEmployeeById(employeeId: string) {
  const { employees } = useLocalData();
  const employee = useMemo(
    () => employees.find((emp) => emp.id === employeeId),
    [employees, employeeId]
  );
  return { data: employee || null, isLoading: false, error: null as unknown };
}

export function useGetDepartments() {
  const { employees } = useLocalData();
  const departments = useMemo(() => {
    const unique = Array.from(new Set(employees.map((emp) => emp.department))).filter(Boolean);
    return unique.sort();
  }, [employees]);

  return { data: departments, isLoading: false, error: null as unknown };
}

export function useUpdateEmployeeStatus() {
  const { updateEmployeeStatus } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ employeeId, isActive }: { employeeId: string; isActive: boolean }) => {
    setIsPending(true);
    try {
      const updated = updateEmployeeStatus(employeeId, isActive);
      if (!updated) throw new Error('Employee not found');
      return updated;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
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
  const { addEmployee } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (input: CreateEmployeeInput) => {
    setIsPending(true);
    try {
      return addEmployee({
        ...input,
        is_active: true,
      } as Omit<Employee, 'id' | 'created_at' | 'updated_at'>);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
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
  const { updateEmployee } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ employeeId, input }: { employeeId: string; input: UpdateEmployeeInput }) => {
    setIsPending(true);
    try {
      const updated = updateEmployee(employeeId, input);
      if (!updated) throw new Error('Employee not found');
      return updated;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
