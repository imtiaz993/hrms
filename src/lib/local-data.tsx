// @ts-nocheck
'use client';

// eslint-disable-next-line import/no-unresolved
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Employee,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  SalaryConfig,
  SalaryRecord,
  TimeEntry,
} from '@/types';
import { PayrollSettings } from '@/types';
import {
  initialEmployees,
  initialHolidays,
  initialLeaveBalances,
  initialLeaveRequests,
  initialPasswords,
  initialPayrollSettings,
  initialSalaryConfigs,
  initialSalaryRecords,
  initialTimeEntries,
} from './mockData';
import {
  calculateOvertimeHours,
  calculateTotalHours,
  isEarlyLeave,
  isEmployeeLate,
} from './time-utils';

type LocalDataContextValue = {
  employees: Employee[];
  timeEntries: TimeEntry[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  salaryConfigs: SalaryConfig[];
  salaryRecords: SalaryRecord[];
  payrollSettings: PayrollSettings;
  authenticate: (email: string, password: string) => Employee | null;
  updatePassword: (email: string, password: string) => boolean;
  logout: () => void;
  addEmployee: (input: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Employee;
  updateEmployee: (id: string, input: Partial<Employee>) => Employee | null;
  updateEmployeeStatus: (id: string, isActive: boolean) => Employee | null;
  clockIn: (params: { employeeId: string; standardHours: number; standardShiftStart: string }) => TimeEntry;
  clockOut: (params: {
    timeEntryId: string;
    employeeId: string;
    standardHours: number;
    standardShiftEnd: string;
  }) => TimeEntry | null;
  createLeaveRequest: (request: LeaveRequest) => LeaveRequest;
  updateLeaveStatus: (
    id: string,
    status: LeaveRequest['status'],
    approverComment?: string
  ) => LeaveRequest | null;
  cancelLeaveRequest: (id: string) => LeaveRequest | null;
  updatePayrollSettings: (settings: Partial<PayrollSettings>) => PayrollSettings;
  setSalaryConfig: (config: SalaryConfig) => void;
  addSalaryRecord: (record: SalaryRecord) => void;
};

const LocalDataContext = createContext<LocalDataContextValue | null>(null);

function createTimestamp() {
  return new Date().toISOString();
}

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function LocalDataProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [passwords, setPasswords] = useState<Record<string, string>>(initialPasswords);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(initialLeaveBalances);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [holidays] = useState<Holiday[]>(initialHolidays);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>(initialSalaryConfigs);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(initialSalaryRecords);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>(initialPayrollSettings);

  const authenticate = useCallback(
    (email: string, password: string) => {
      const storedPassword = passwords[email];
      if (!storedPassword || storedPassword !== password) return null;
      return employees.find((emp: Employee) => emp.email.toLowerCase() === email.toLowerCase()) || null;
    },
    [employees, passwords]
  );

  const updatePassword = useCallback(
    (email: string, password: string) => {
      if (!passwords[email]) return false;
      setPasswords((prev: Record<string, string>) => ({ ...prev, [email]: password }));
      return true;
    },
    [passwords]
  );

  const logout = useCallback(() => {
    // Consumers handle auth state; nothing to do here beyond placeholder.
  }, []);

  const addEmployee = useCallback(
    (input: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      const now = createTimestamp();
      const newEmployee: Employee = {
        ...input,
        id: generateId('emp'),
        created_at: now,
        updated_at: now,
      };
      setEmployees((prev: Employee[]) => [newEmployee, ...prev]);
      return newEmployee;
    },
    []
  );

  const updateEmployee = useCallback((id: string, input: Partial<Employee>) => {
    let updated: Employee | null = null;
    setEmployees((prev: Employee[]) =>
      prev.map((emp: Employee) => {
        if (emp.id === id) {
          updated = { ...emp, ...input, updated_at: createTimestamp() };
          return updated;
        }
        return emp;
      })
    );
    return updated;
  }, []);

  const updateEmployeeStatus = useCallback((id: string, isActive: boolean) => {
    return updateEmployee(id, { is_active: isActive });
  }, [updateEmployee]);

  const clockIn = useCallback(
    ({ employeeId, standardHours, standardShiftStart }: {
      employeeId: string;
      standardHours: number;
      standardShiftStart: string;
    }) => {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const existing = timeEntries.find(
        (entry: TimeEntry) => entry.employee_id === employeeId && entry.date === dateStr
      );

      if (existing && !existing.time_out) {
        return existing;
      }

      const timestamp = date.toISOString();
      const newEntry: TimeEntry = {
        id: generateId('time'),
        employee_id: employeeId,
        date: dateStr,
        time_in: timestamp,
        time_out: null,
        total_hours: null,
        overtime_hours: 0,
        is_late: isEmployeeLate(timestamp, standardShiftStart),
        is_early_leave: false,
        notes: '',
        created_at: timestamp,
        updated_at: timestamp,
      };

      setTimeEntries((prev: TimeEntry[]) => [newEntry, ...prev]);
      return newEntry;
    },
    [timeEntries]
  );

  const clockOut = useCallback(
    ({ timeEntryId, employeeId, standardHours, standardShiftEnd }: {
      timeEntryId: string;
      employeeId: string;
      standardHours: number;
      standardShiftEnd: string;
    }) => {
      let updatedEntry: TimeEntry | null = null;
      const timestamp = new Date().toISOString();

      setTimeEntries((prev: TimeEntry[]) =>
        prev.map((entry: TimeEntry) => {
          if (entry.id === timeEntryId && entry.employee_id === employeeId) {
            const totalHours = entry.time_in ? calculateTotalHours(entry.time_in, timestamp) : 0;
            updatedEntry = {
              ...entry,
              time_out: timestamp,
              total_hours: totalHours,
              overtime_hours: calculateOvertimeHours(totalHours, standardHours),
              is_early_leave: isEarlyLeave(timestamp, standardShiftEnd),
              updated_at: timestamp,
            };
            return updatedEntry;
          }
          return entry;
        })
      );

      return updatedEntry;
    },
    []
  );

  const createLeaveRequest = useCallback((request: LeaveRequest) => {
    setLeaveRequests((prev: LeaveRequest[]) => [request, ...prev]);
    return request;
  }, []);

  const updateLeaveStatus = useCallback(
    (id: string, status: LeaveRequest['status'], approverComment?: string) => {
      let updated: LeaveRequest | null = null;
      setLeaveRequests((prev: LeaveRequest[]) =>
        prev.map((req: LeaveRequest) => {
          if (req.id === id) {
            updated = {
              ...req,
              status,
              approver_comment: approverComment || req.approver_comment,
              updated_at: createTimestamp(),
            };
            return updated;
          }
          return req;
        })
      );
      return updated;
    },
    []
  );

  const cancelLeaveRequest = useCallback((id: string) => {
    return updateLeaveStatus(id, 'rejected');
  }, [updateLeaveStatus]);

  const updatePayrollSettings = useCallback(
    (settings: Partial<PayrollSettings>) => {
      setPayrollSettings((prev: PayrollSettings) => ({
        ...prev,
        ...settings,
        updated_at: createTimestamp(),
      }));
      return {
        ...payrollSettings,
        ...settings,
      };
    },
    [payrollSettings]
  );

  const setSalaryConfig = useCallback((config: SalaryConfig) => {
    setSalaryConfigs((prev: SalaryConfig[]) => {
      const filtered = prev.filter((item: SalaryConfig) => item.employee_id !== config.employee_id);
      return [config, ...filtered];
    });
  }, []);

  const addSalaryRecord = useCallback((record: SalaryRecord) => {
    setSalaryRecords((prev: SalaryRecord[]) => [record, ...prev]);
  }, []);

  const value = useMemo<LocalDataContextValue>(
    () => ({
      employees,
      timeEntries,
      leaveBalances,
      leaveRequests,
      holidays,
      salaryConfigs,
      salaryRecords,
      payrollSettings,
      authenticate,
      updatePassword,
      logout,
      addEmployee,
      updateEmployee,
      updateEmployeeStatus,
      clockIn,
      clockOut,
      createLeaveRequest,
      updateLeaveStatus,
      cancelLeaveRequest,
      updatePayrollSettings,
      setSalaryConfig,
      addSalaryRecord,
    }),
    [
      employees,
      timeEntries,
      leaveBalances,
      leaveRequests,
      holidays,
      salaryConfigs,
      salaryRecords,
      payrollSettings,
      authenticate,
      updatePassword,
      logout,
      addEmployee,
      updateEmployee,
      updateEmployeeStatus,
      clockIn,
      clockOut,
      createLeaveRequest,
      updateLeaveStatus,
      cancelLeaveRequest,
      updatePayrollSettings,
      setSalaryConfig,
      addSalaryRecord,
    ]
  );

  return <LocalDataContext.Provider value={value}>{children}</LocalDataContext.Provider>;
}

export function useLocalData() {
  const ctx = useContext(LocalDataContext);
  if (!ctx) {
    throw new Error('useLocalData must be used within LocalDataProvider');
  }
  return ctx;
}

