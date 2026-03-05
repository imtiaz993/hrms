'use client';

import { useState, useEffect, useMemo } from 'react';
import { LeaveApprovalModal } from '@/components/admin/leaves/leave-approval-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/time-utils';
import { Search, AlertCircle, Eye, CheckCircle2, XCircle, Clock, UserCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseUser';
import { getCurrentDate, formatISOPlain } from '@/lib/time-utils';
import { useToast } from '@/components/ui/toast';

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
  designation: string;
}

interface LeaveRequest {
  id: any; // Using any for ID to be safe across string/number types from Supabase
  status: Status;
  employee_id: string;
  employee: Employee;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  created_at: string;
  reason?: string;
}


export default function LeaveRequestsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { addToast } = useToast();


  async function allLeaves() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee_id,
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
  const handleStatusChange = (leaveId: string, newStatus: Status) => {
    setLeaves((prev) =>
      prev.map((leave) =>
        leave.id === leaveId ? { ...leave, status: newStatus } : leave
      )
    );
  };


  const handleAction = async (requestId: any, action: "approved" | "rejected") => {
    setProcessingId(requestId.toString());
    try {
      // Use == to handle potential string/number mismatch gracefully
      const request = leaves.find((r) => r.id == requestId);
      if (!request) {
        console.error("Request not found locally:", requestId);
        return;
      }

      console.log("Processing action:", action, "for leave:", requestId, "employee:", request.employee_id);

      // 1. Balance logic - Move logics from popup
      if (action === "approved" && request.status === "rejected" && (request.leave_type === "sick" || request.leave_type === "paid")) {
        // Subtract again because rejection added them back
        const column = request.leave_type === "sick" ? "remaining_sick_leaves" : "remaining_casual_leaves";
        const { data: emp, error: empError } = await supabase
          .from("employees")
          .select(column)
          .eq("id", request.employee_id)
          .single();

        if (!empError && emp) {
          const newBalance = Math.max(0, Number((emp as any)[column]) - Number(request.total_days));
          await supabase
            .from("employees")
            .update({ [column]: newBalance })
            .eq("id", request.employee_id);
        }
      } else if (action === "rejected" && request.status !== "rejected" && (request.leave_type === "sick" || request.leave_type === "paid")) {
        // Add back because it was subtracted during request
        const column = request.leave_type === "sick" ? "remaining_sick_leaves" : "remaining_casual_leaves";
        const totalColumn = request.leave_type === "sick" ? "total_sick_leaves" : "total_casual_leaves";
        const { data: emp, error: empError } = await supabase
          .from("employees")
          .select(`${column}, ${totalColumn}`)
          .eq("id", request.employee_id)
          .single();

        if (!empError && emp) {
          const newBalance = Math.min(
            Number((emp as any)[totalColumn]),
            Number((emp as any)[column]) + Number(request.total_days)
          );
          await supabase
            .from("employees")
            .update({ [column]: newBalance })
            .eq("id", request.employee_id);
        }
      }

      // 2. Update status
      const { error: updateError } = await supabase
        .from("leave_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // --- Automatic Schedule Sync ---
      try {
        const startDate = new Date(request.start_date);
        const endDate = new Date(request.end_date);
        const scheduleBatch = [];

        // Fetch Holidays and Employee data for status recalculation
        const { data: holidays } = await supabase
          .from('holidays')
          .select('date')
          .gte('date', request.start_date)
          .lte('date', request.end_date);

        const { data: empInfo } = await supabase
          .from('employees')
          .select('*')
          .eq('id', request.employee_id)
          .single();

        const holidayList = holidays?.map(h => h.date) || [];

        // Loop through each day of the leave
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const dayNum = d.getDay();

          let scheduleStatus: any = "scheduled";
          let isOff = false;

          if (action === "approved") {
            scheduleStatus = "leave";
            isOff = true;
          } else {
            // Rejection: Recalculate original status (Work, Holiday, or Weekend)
            const isHoliday = holidayList.includes(dateStr);
            const isWeekend = (dayNum === 0 || dayNum === 6);

            if (isHoliday) { scheduleStatus = "holiday"; isOff = true; }
            else if (isWeekend) { scheduleStatus = "weekend"; isOff = true; }
          }

          scheduleBatch.push({
            id: `${request.employee_id}_${dateStr}`,
            employee_id: request.employee_id,
            date: dateStr,
            day_of_week: d.toLocaleDateString('en-US', { weekday: 'long' }),
            shift_start: empInfo?.standard_shift_start || '09:00:00',
            shift_end: empInfo?.standard_shift_end || '18:00:00',
            standard_hours: empInfo?.standard_hours_per_day || 8,
            grace_time: 15,
            is_off_day: isOff,
            status: scheduleStatus
          });
        }

        // Apply updates to work_schedules
        const { error: batchError } = await supabase.from('work_schedules').upsert(scheduleBatch);
        if (batchError) console.error("Schedule Sync Error:", batchError);
      } catch (syncErr) {
        console.error("Schedule Sync Failed:", syncErr);
      }
      // --- End of Sync ---

      // 3. Notification
      await fetch("/api/admin/send-notification-admin/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: request.employee_id,
          title: `Leave ${action === "approved" ? "Approved" : "Rejected"}`,
          body: `Your leave request for ${formatDate(request.start_date)} has been ${action}.`,
        }),
      });

      addToast({
        title: "Success",
        description: `Leave ${action} successfully`,
        variant: "success",
      });

      // Update local state
      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id == requestId ? { ...leave, status: action } : leave
        )
      );
    } catch (err: any) {
      console.error("Action error:", err);
      addToast({
        title: "Error",
        description: err?.message || "Failed to process leave request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {

      if (typeFilter !== 'all' && leave.leave_type !== typeFilter) return false;

      if (statusFilter !== 'all' && leave.status !== statusFilter) return false;

      const fullName = `${leave.employee.first_name} ${leave.employee.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
        leave.employee_id.includes(searchQuery) || // Changed to directly use employee_id as string
        (leave.reason || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (searchQuery && !matchesSearch) return false;

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


      <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by employee name, ID or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
          <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/80">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Employee</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Dates</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Reason</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {paginatedLeaves.map((request: LeaveRequest) => {
                      const statusInfo = statusConfig[request.status] || {
                        label: request.status || 'Unknown',
                        variant: 'outline' as const,
                        color: 'gray-100'
                      };
                      const fullName = `${request.employee?.first_name || ''} ${request.employee?.last_name || ''}`.trim();
                      const initials = `${request.employee?.first_name?.charAt(0) || ''}${request.employee?.last_name?.charAt(0) || ''}`.toUpperCase() || '??';

                      return (
                        <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{fullName}</div>
                                <p className="text-[11px] text-slate-500 uppercase tracking-wider">{request.employee.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
                              {leaveTypeLabels[request.leave_type]}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="max-w-[180px] truncate text-slate-600 text-xs italic"
                              title={request.reason}
                            >
                              {request.reason ? `“${request.reason}”` : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={statusInfo.variant}
                              className="rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm"
                            >
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {request.status === "pending" ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
                                    onClick={() => handleAction(request.id.toString(), "approved")}
                                    disabled={!!processingId}
                                  >
                                    {processingId === request.id.toString() ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                    onClick={() => handleAction(request.id.toString(), "rejected")}
                                    disabled={!!processingId}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="text-[11px] text-slate-400 italic mr-1">
                                    Processed on {formatDate(request.created_at)}
                                  </span>
                                  {request.status === "approved" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors text-[10px]"
                                      onClick={() => handleAction(request.id.toString(), "rejected")}
                                      disabled={!!processingId}
                                    >
                                      {processingId === request.id.toString() ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <XCircle className="h-3 w-3 mr-1" />
                                      )}
                                      Reject
                                    </Button>
                                  ) : request.status === "rejected" ? (
                                    <Button
                                      size="sm"
                                      className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm text-[10px]"
                                      onClick={() => handleAction(request.id.toString(), "approved")}
                                      disabled={!!processingId}
                                    >
                                      {processingId === request.id.toString() ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                      )}
                                      Approve
                                    </Button>
                                  ) : null}
                                </>
                              )}
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


          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{showingFrom}</span> to{" "}
              <span className="font-semibold text-slate-900">{showingTo}</span> of{" "}
              <span className="font-semibold text-slate-900">{total}</span> total entries
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <span className="text-xs text-slate-500">Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {[5, 10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium text-slate-700 min-w-[3rem] text-center">
                  {safePage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
