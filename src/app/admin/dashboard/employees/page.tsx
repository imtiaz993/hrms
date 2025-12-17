'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAllEmployees, useGetDepartments, useUpdateEmployeeStatus } from '@/hooks/admin/useEmployees';
import { EmployeeList } from '@/components/admin/employees/employee-list';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, AlertCircle, Users } from 'lucide-react';

export default function EmployeesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetAllEmployees(searchQuery, department, status);

  const { data: departments } = useGetDepartments();
   const { mutateAsync: updateStatus } = useUpdateEmployeeStatus();

  // ✅ local copy for instant UI updates
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    setEmployees(data ?? []);
  }, [data]);

  // ✅ instant toggle handler
  const handleToggleActive = async (employeeId: string, nextActive: boolean) => {
    // optimistic update
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, is_active: nextActive } : e))
    );

    try {
      await updateStatus({ employeeId, isActive: nextActive });
      await refetch();
    } catch (e) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, is_active: !nextActive } : e))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-gray-600 mt-1">Manage and view all employees</p>
        </div>
        <Button onClick={() => router.push('/admin/dashboard/employees/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load employee data.
            <Button variant="link" onClick={refetch} className="ml-2 p-0 h-auto">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : employees && employees.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No employees found. Add your first employee.</p>
              <Button onClick={() => router.push('/admin/dashboard/employees/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        employees && (
          <EmployeeList
            employees={employees}
          />
        )
      )}
    </div>
  );
}
