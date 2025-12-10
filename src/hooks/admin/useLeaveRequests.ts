import { LeaveRequest } from '@/types';
import { useLocalData } from '@/lib/local-data';
import { useEffect, useMemo, useState } from 'react';

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
  const { leaveRequests, employees } = useLocalData();
  const [data, setData] = useState<LeaveRequestWithEmployee[]>([]);

  useEffect(() => {
    let results = leaveRequests
      .filter((req) => (typeFilter && typeFilter !== 'all' ? req.leave_type === typeFilter : true))
      .filter((req) => (statusFilter && statusFilter !== 'all' ? req.status === statusFilter : true))
      .map((req) => {
        const employee = employees.find((emp) => emp.id === req.employee_id)!;
        return {
          ...req,
          employee: {
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            department: employee.department,
            employee_id: employee.employee_id || null,
          },
        };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (searchQuery && searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter((req) => {
        const fullName = `${req.employee.first_name} ${req.employee.last_name}`.toLowerCase();
        const empId = (req.employee.employee_id || '').toLowerCase();
        return fullName.includes(lowerQuery) || empId.includes(lowerQuery);
      });
    }

    setData(results);
  }, [employees, leaveRequests, searchQuery, statusFilter, typeFilter]);

  return { data, isLoading: false, error: null as unknown };
}

export function useApproveLeaveRequest() {
  const { updateLeaveStatus } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    requestId,
    adminComment,
  }: {
    requestId: string;
    adminComment?: string;
  }) => {
    setIsPending(true);
    try {
      const updated = updateLeaveStatus(requestId, 'approved', adminComment);
      if (!updated) throw new Error('Leave request not found');
      return updated;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useRejectLeaveRequest() {
  const { updateLeaveStatus } = useLocalData();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    requestId,
    adminComment,
  }: {
    requestId: string;
    adminComment?: string;
  }) => {
    setIsPending(true);
    try {
      const updated = updateLeaveStatus(requestId, 'rejected', adminComment);
      if (!updated) throw new Error('Leave request not found');
      return updated;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
