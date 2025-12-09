'use client';

import { useRouter, useParams } from 'next/navigation';
import { useGetEmployeeById } from '@/hooks/admin/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/time-utils';
import {
  ArrowLeft,
  AlertCircle,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Edit,
} from 'lucide-react';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const { data: employee, isLoading, error, refetch } = useGetEmployeeById(employeeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load employee data.
          <Button variant="link" onClick={() => refetch()} className="ml-2 p-0 h-auto">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>
            <p className="text-gray-600 mt-1">View employee information</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/dashboard/employees/${employeeId}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Employee
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <UserCircle className="h-16 w-16 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-gray-600">{employee.designation}</p>
              <p className="text-gray-500 text-sm">{employee.department}</p>
              <div className="flex items-center gap-2 mt-2">
                {employee.employee_id && (
                  <Badge variant="secondary">ID: {employee.employee_id}</Badge>
                )}
                <Badge variant={employee.is_active ? 'success' : 'destructive'}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {employee.is_admin && <Badge variant="default">Admin</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <UserCircle className="h-5 w-5 text-blue-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium">{fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <p className="font-medium">{employee.email}</p>
            </div>
            {employee.phone_number && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </p>
                <p className="font-medium">{employee.phone_number}</p>
              </div>
            )}
            {employee.address && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </p>
                <p className="font-medium">{employee.address}</p>
              </div>
            )}
            {employee.gender && (
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-medium capitalize">{employee.gender.replace('_', ' ')}</p>
              </div>
            )}
            {employee.date_of_birth && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </p>
                <p className="font-medium">{formatDate(employee.date_of_birth)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span>Job Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.employee_id && (
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{employee.employee_id}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{employee.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Designation</p>
              <p className="font-medium">{employee.designation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Joining Date
              </p>
              <p className="font-medium">{formatDate(employee.join_date)}</p>
            </div>
            {employee.employment_type && (
              <div>
                <p className="text-sm text-gray-600">Employment Type</p>
                <p className="font-medium capitalize">
                  {employee.employment_type.replace('-', ' ')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Work Schedule</p>
              <p className="font-medium">
                {employee.standard_shift_start} - {employee.standard_shift_end} (
                {employee.standard_hours_per_day}h)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={employee.is_active ? 'success' : 'destructive'}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Emergency Contact</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employee.emergency_contact_name ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{employee.emergency_contact_name}</p>
              </div>
              {employee.emergency_contact_relation && (
                <div>
                  <p className="text-sm text-gray-600">Relation</p>
                  <p className="font-medium capitalize">{employee.emergency_contact_relation}</p>
                </div>
              )}
              {employee.emergency_contact_phone && (
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </p>
                  <p className="font-medium">{employee.emergency_contact_phone}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No emergency contact information provided
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Additional features like attendance overview, leave history, and salary summary will be
          available in future updates.
        </AlertDescription>
      </Alert>
    </div>
  );
}
