'use client';

import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/time-utils';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  UserCircle,
  Edit,
  Key,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
  const employmentStatus = currentUser.is_active ? 'Active' : 'Inactive';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your personal information</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/employee/dashboard/profile/edit')}
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button
            onClick={() => router.push('/employee/dashboard/profile/change-password')}
            variant="outline"
          >
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <UserCircle className="h-16 w-16 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-gray-600">{currentUser.designation}</p>
              <p className="text-gray-500 text-sm">{currentUser.department}</p>
              <div className="flex items-center gap-2 mt-2">
                {currentUser.employee_id && (
                  <Badge variant="secondary">ID: {currentUser.employee_id}</Badge>
                )}
                <Badge variant={currentUser.is_active ? 'success' : 'destructive'}>
                  {employmentStatus}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
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
              <p className="font-medium">{currentUser.email}</p>
            </div>
            {currentUser.phone_number && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </p>
                <p className="font-medium">{currentUser.phone_number}</p>
              </div>
            )}
            {currentUser.address && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </p>
                <p className="font-medium">{currentUser.address}</p>
              </div>
            )}
            {currentUser.gender && (
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-medium capitalize">{currentUser.gender.replace('_', ' ')}</p>
              </div>
            )}
            {currentUser.date_of_birth && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </p>
                <p className="font-medium">{formatDate(currentUser.date_of_birth)}</p>
              </div>
            )}
            {!currentUser.phone_number && !currentUser.address && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No additional personal information provided
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
            {currentUser.employee_id && (
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{currentUser.employee_id}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{currentUser.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Designation</p>
              <p className="font-medium">{currentUser.designation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Joining Date
              </p>
              <p className="font-medium">{formatDate(currentUser.join_date)}</p>
            </div>
            {currentUser.employment_type && (
              <div>
                <p className="text-sm text-gray-600">Employment Type</p>
                <p className="font-medium capitalize">{currentUser.employment_type.replace('-', ' ')}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={currentUser.is_active ? 'success' : 'destructive'}>
                {employmentStatus}
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
          {currentUser.emergency_contact_name ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{currentUser.emergency_contact_name}</p>
              </div>
              {currentUser.emergency_contact_relation && (
                <div>
                  <p className="text-sm text-gray-600">Relation</p>
                  <p className="font-medium capitalize">{currentUser.emergency_contact_relation}</p>
                </div>
              )}
              {currentUser.emergency_contact_phone && (
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </p>
                  <p className="font-medium">{currentUser.emergency_contact_phone}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No emergency contact information provided.
              <br />
              <Button
                variant="link"
                onClick={() => router.push('/employee/dashboard/profile/edit')}
                className="mt-2"
              >
                Add Emergency Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
