"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeaveRequest, LeaveStatus, LeaveType } from "@/types";
import { supabase } from "@/lib/supabaseUser";
import { formatDate } from "@/lib/time-utils";
import { Calendar, AlertCircle, X, Eye } from "lucide-react";
import { isAfter, parseISO } from "date-fns";

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
  employeeId: string;
  setLeaves: any;
  employeeName:string;
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
  employeeName,
  
  setLeaves,
}: LeaveRequestsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  const cancelLeaveRequest = async (requestId: string) => {
    setIsCancelling(true);

    try {
      const { error } = await supabase
        .from("leave_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
      const { data: settings, error: settingsError } = await supabase
        .from("admin_settings")
        .select("leave_notification")
        .single();

      if (settingsError) {
        console.error("Settings fetch error:", settingsError);
      }
      if (settings?.leave_notification) {
        await fetch("/api/send-notification/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            title: "Leave Request Cancelled",
            body: `${employeeName} has cancelled their leave request.`,
          }),
        });
        return true;
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    setError("");
    setCancellingId(requestId);
    try {
      await cancelLeaveRequest(requestId);
      setLeaves((prev: LeaveRequest[]) =>
        prev.filter((leave) => leave.id !== requestId),
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

    console.log("canCancelRequest", canCancelRequest);
  };

  const formatDuration = (request: LeaveRequest): string => {
    if (request.is_half_day) return "Half day";
    if (request.total_days === 1) return "1 day";
    return `${request.total_days} days`;
  };

  const formatDateRange = (request: LeaveRequest): string => {
    if (request.start_date === request.end_date)
      return formatDate(request.start_date);
    return `${formatDate(request.start_date)} – ${formatDate(request.end_date)}`;
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
    <>
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
                    Status
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
                    <td className="px-4 py-3 align-top">
                      <Badge
                        variant={statusConfig[request.status].variant}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        {statusConfig[request.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top text-sm space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedLeave(request)}
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </Button>
                      {/* 
                       {canCancelRequest(request) && ( */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCancel(request.id)}
                        disabled={cancellingId === request.id}
                      >
                        <X className="h-4 w-4 text-rose-500" />
                      </Button>

                      {/* )} */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Standalone popup for Leave Details rendered at document.body level */}
      {selectedLeave &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedLeave(null)}
          >
            <Card
              className="w-full max-w-lg relative bg-white shadow-xl rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">
                  Leave Details
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedLeave(null)}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-700 mt-1">
                  <div>
                    <span className="font-medium">Dates: </span>
                    {formatDateRange(selectedLeave)}
                  </div>
                  <div>
                    <span className="font-medium">Duration: </span>
                    {formatDuration(selectedLeave)}
                  </div>
                  <div>
                    <span className="font-medium">Type: </span>
                    {leaveTypeLabels[selectedLeave.leave_type]}
                  </div>
                  <div>
                    <span className="font-medium">Status: </span>
                    {statusConfig[selectedLeave.status].label}
                  </div>
                  <div>
                    <span className="font-medium">Reason: </span>
                    {selectedLeave.reason || "—"}
                  </div>
                  {selectedLeave.approver_comment && (
                    <div>
                      <span className="font-medium">Approver Comment: </span>
                      {selectedLeave.approver_comment}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>,
          document.body
        )}
    </>
  );
}
