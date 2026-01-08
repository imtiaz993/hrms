"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeaveRequest, LeaveStatus, LeaveType } from "@/types";
import { useCancelLeaveRequest } from "@/hooks/useLeave";
import { formatDate } from "@/lib/time-utils";
import { Calendar, AlertCircle, X } from "lucide-react";
import { isAfter, parseISO } from "date-fns";

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
  employeeId: string;
  setLeaves: any;
}

const statusConfig: Record<
  LeaveStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "success" | "warning";
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
  },
  approved: {
    label: "Approved",
    variant: "success",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
  },
};

const leaveTypeLabels: Record<LeaveType, string> = {
  paid: "Paid",
  sick: "Sick",
  unpaid: "Unpaid",
};

export function LeaveRequestsList({
  requests,
  employeeId,
  setLeaves,
}: LeaveRequestsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cancelMutation = useCancelLeaveRequest();

  const handleCancel = async (requestId: string) => {
    setError("");
    setCancellingId(requestId);

    try {
      await cancelMutation.mutateAsync({ requestId, employeeId });
      setLeaves((prev: LeaveRequest[]) =>
        prev.filter((leave) => leave.id !== requestId)
      );
    } catch (err: any) {
      setError(err.message || "Failed to cancel leave request.");
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelRequest = (request: LeaveRequest): boolean => {
    if (request.status !== "pending") return false;
    const startDate = parseISO(request.start_date);
    const today = new Date();
    return (
      isAfter(startDate, today) ||
      startDate.toDateString() === today.toDateString()
    );
  };

  const formatDuration = (request: LeaveRequest): string => {
    if (request.is_half_day) return "Half day";
    if (request.total_days === 1) return "1 day";
    return `${request.total_days} days`;
  };

  const formatDateRange = (request: LeaveRequest): string => {
    if (request.start_date === request.end_date) {
      return formatDate(request.start_date);
    }
    return `${formatDate(request.start_date)} – ${formatDate(
      request.end_date
    )}`;
  };

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm";

  if (requests.length === 0) {
    return (
      <Card className={cardBase}>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center">
            <Calendar className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              You haven&apos;t requested any leave yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Use the form above to submit your first leave request.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          My Leave Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert
            variant="destructive"
            className="mb-4 border-rose-200 bg-rose-50 text-sm"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Dates
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 align-top text-sm text-slate-900">
                    {formatDateRange(request)}
                  </td>
                  <td className="px-4 py-3 align-top text-sm font-medium text-slate-800">
                    {formatDuration(request)}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-700">
                    {leaveTypeLabels[request.leave_type]}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge
                      variant={statusConfig[request.status].variant}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {statusConfig[request.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600 max-w-xs truncate">
                    {request.reason || "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    {canCancelRequest(request) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleCancel(request.id);
                        }}
                        disabled={cancellingId === request.id}
                        className="rounded-full border-slate-200 text-xs"
                      >
                        <X className="mr-1.5 h-3 w-3" />
                        {cancellingId === request.id ? "Cancelling…" : "Cancel"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.some(
          (r) => r.status === "approved" && r.approver_comment
        ) && (
          <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
            <p className="mb-1 font-semibold">Approver comments</p>
            {requests
              .filter((r) => r.status === "approved" && r.approver_comment)
              .map((request) => (
                <div key={request.id} className="mb-1">
                  <span className="font-medium">
                    {formatDateRange(request)}:
                  </span>{" "}
                  {request.approver_comment}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
