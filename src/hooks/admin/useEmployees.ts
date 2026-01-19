import { Employee } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalData } from '@/lib/local-data';
import { supabase } from '@/lib/supabaseUser';

export function useGetAllEmployees() {
  const [data, setData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: rows, error: err } = await supabase
        .from("employees")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .returns<Employee[]>();

      if (err) throw err;
      setData(rows ?? []);
    } catch (e) {
      setError(e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}



export function useGetEmployeeById(employeeId: string) {
  const [data, setData] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!employeeId) {
      setData(null);
      return;
    }

    let cancelled = false;

    const fetchEmployee = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: row, error: err } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .single();

        if (err) throw err;

        if (!cancelled) {
          setData(row as Employee);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchEmployee();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  return { data, isLoading, error };
}

export function useGetDepartments() {
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDepartments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: rows, error: err } = await supabase
          .from("employees")
          .select("department");

        if (err) throw err;

        const unique = Array.from(
          new Set(
            (rows ?? [])
              .map((r: any) => r.department)
              .filter(Boolean)
          )
        ).sort();

        if (!cancelled) {
          setData(unique);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setData([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

export function useUpdateEmployeeStatus() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    employeeId,
    isActive,
  }: {
    employeeId: string;
    isActive: boolean;
  }): Promise<Employee> => {
    setIsPending(true);

    try {
      const { data, error } = await supabase
        .from("employees")
        .update({ is_active: isActive })
        .eq("id", employeeId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Employee not found");
      }

      return data as Employee;
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
const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutateAsync = async ({
    employeeId,
    input,
  }: {
    employeeId: string;
    input: UpdateEmployeeInput;
  }): Promise<Employee> => {
    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const payload = {
        ...input,
        standard_hours_per_day:
          input.standard_hours_per_day != null
            ? Number(input.standard_hours_per_day)
            : undefined,
        date_of_birth: input.date_of_birth || null,
      };

      const { data, error: err } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", employeeId)
        .select("*")
        .single();

      if (err) throw err;
      if (!data) throw new Error("Employee not found");

      setIsSuccess(true);
      return data as Employee;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, isSuccess, error };
}

export function useDeleteEmployee() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutateAsync = async (employeeId: string): Promise<void> => {
    setIsPending(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from("employees")
        .update({
          is_deleted: true,
        })
        .eq("id", employeeId);

      if (err) throw err;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
}