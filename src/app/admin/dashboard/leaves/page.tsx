'use client';

import { useState, useEffect, useMemo } from 'react';
import { LeaveApprovalModal } from '@/components/admin/leaves/leave-approval-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/time-utils';
import { Search, AlertCircle, Eye, CheckCircle2, XCircle, Clock, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseUser';

const leaveTypeLabels: Record<string, string> = {
  paid: 'Paid Leave',
  sick: 'Sick Leave',
  unpaid: 'Unpaid Leave',
};

const statusConfig = {
  pending: { label: "Pending", variant: "warning" as const, color: "yellow-100" },
  approved: { label: "Approved", variant: "success" as const, color: "green-100" },
  rejected: { label: "Rejected", variant: "destructive" as const, color: "red-100" },
  cancelled: { label: "Cancelled", variant: "secondary" as const, color: "gray-100" },
};


type Status = keyof typeof statusConfig; 

interface Employee {
  first_name: string;
  last_name: string;
  department: string;
}

interface LeaveRequest {
  id: number;
  status: Status; 
  employee: Employee;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  created_at: string;
}


export default function LeaveRequestsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);


  async function allLeaves() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employee_id (
          first_name,
          last_name,
          department,
          designation
        )
      `);

    setIsLoading(false);

    if (error) {
      console.error(error);
      setError('Failed to fetch leave requests.');
      return [];
    }

    return data || [];
  }

  useEffect(() => {
    const fetchLeaves = async () => {
      const data = await allLeaves();
      setLeaves(data);
    };

    fetchLeaves();
  }, []);
  const handleStatusChange = (leaveId: number, newStatus: Status) => {
  setLeaves((prev) =>
    prev.map((leave) =>
      leave.id === leaveId ? { ...leave, status: newStatus } : leave
    )
  );
};


  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
  
      if (typeFilter !== 'all' && leave.leave_type !== typeFilter) return false;

      if (statusFilter !== 'all' && leave.status !== statusFilter) return false;
    
      const fullName = `${leave.employee.first_name} ${leave.employee.last_name}`.toLowerCase();
      if (searchQuery && !fullName.includes(searchQuery.toLowerCase()) && !leave.employee_id.toString().includes(searchQuery)) return false;

      return true;
    });
  }, [leaves, typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, searchQuery, pageSize]);

  const total = filteredLeaves.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + pageSize);
  const showingFrom = total === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, total);

  return (
    <div className="space-y-6">
  
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
        <p className="text-gray-600 mt-1">Manage all employee leave requests</p>
      </div>

  
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Types</option>
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No leave requests found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeaves.map((request:LeaveRequest) => {
                    const statusInfo = statusConfig[request.status];
                    const fullName = `${request.employee.first_name} ${request.employee.last_name}`;

                    return (
                      <tr key={request.id} className={`${statusInfo.color} hover:opacity-80`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <UserCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{fullName}</div>
                              <div className="text-xs text-gray-500">{request.employee.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{leaveTypeLabels[request.leave_type]}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(request.start_date)} → {formatDate(request.end_date)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.total_days}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(request.created_at)}</td>
                        <td className="px-4 py-4 whitespace-nowrap"><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                            
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{showingFrom}</span>–
            <span className="font-medium text-gray-900">{showingTo}</span> of{" "}
            <span className="font-medium text-gray-900">{total}</span>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <span className="text-sm text-gray-600">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="flex h-9 w-[96px] rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[5, 10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Prev</span>
              </Button>
              <div className="text-sm text-gray-700 text-center px-2 whitespace-nowrap">
                Page <span className="font-medium">{safePage}</span> /{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex-1 sm:flex-none"
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        </>
      )}

      {selectedRequest && (
        <LeaveApprovalModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
           onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
