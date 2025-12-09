'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceOverviewStats } from '@/hooks/admin/useAttendance';
import { Users, CheckCircle2, XCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface AttendanceKPICardsProps {
  stats: AttendanceOverviewStats;
}

export function AttendanceKPICards({ stats }: AttendanceKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          <p className="text-xs text-gray-600 mt-1">Active employees</p>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900">Present Today</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
          <p className="text-xs text-green-700 mt-1">Clocked in</p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-900">Absent</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
          <p className="text-xs text-red-700 mt-1">Not clocked in</p>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-900">Late Arrivals</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.lateArrivals}</div>
          <p className="text-xs text-yellow-700 mt-1">After start time</p>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-900">Early Leaves</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.earlyLeaves}</div>
          <p className="text-xs text-orange-700 mt-1">Left early</p>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900">Incomplete</CardTitle>
          <AlertCircle className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.incompletePunches}</div>
          <p className="text-xs text-purple-700 mt-1">Missing punch</p>
        </CardContent>
      </Card>
    </div>
  );
}
