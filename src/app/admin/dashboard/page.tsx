'use client';

import { useRouter } from 'next/navigation';
import { useGetAllEmployees } from '@/hooks/admin/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: employees } = useGetAllEmployees();

  const activeEmployees = employees?.filter((emp) => emp.is_active).length || 0;
  const inactiveEmployees = employees?.filter((emp) => !emp.is_active).length || 0;
  const totalEmployees = employees?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-gray-600 mt-1">Total registered employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
            <p className="text-xs text-gray-600 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Employees</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveEmployees}</div>
            <p className="text-xs text-gray-600 mt-1">Currently inactive</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => router.push('/admin/dashboard/employees')}
            className="w-full md:w-auto"
          >
            <Users className="h-4 w-4 mr-2" />
            View All Employees
          </Button>
          <Button
            onClick={() => router.push('/admin/dashboard/employees/add')}
            variant="outline"
            className="w-full md:w-auto ml-0 md:ml-3"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Employee
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Additional admin features like leave approval, attendance reports, and payroll
            management will be available in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
