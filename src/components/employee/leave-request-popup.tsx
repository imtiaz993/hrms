"use client";

import { useState } from "react";
import { useCreateLeaveRequest } from "@/hooks/useLeave";
import { useGetLeaveRequests } from "@/hooks/useLeave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { LeaveType, LeaveRequest } from "@/types";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { calculateLeaveDays, hasOverlappingLeave } from "@/hooks/useLeave";
interface LeaveRequestPopupProps {
  employeeId: string;
  onClose: () => void;
}

export function LeaveRequestPopup({
  employeeId,
  onClose,
}: LeaveRequestPopupProps) {
  const createMutation = useCreateLeaveRequest();
  const { data: existingRequests = [] } = useGetLeaveRequests(employeeId);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("paid");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!startDate || !endDate) {
      setError("Please select start and end dates.");
      return;
    }
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const today = startOfDay(new Date());

    if (isBefore(start, today)) {
      setError("Start date cannot be in the past.");
      return;
    }
    if (isBefore(end, start)) {
      setError("End date must be on or after start date.");
      return;
    }
    if (isHalfDay && startDate !== endDate) {
      setError("Half-day leave can only be for a single day.");
      return;
    }
    if (hasOverlappingLeave(existingRequests, startDate, endDate)) {
      setError(
        "You already have a pending or approved leave request for these dates."
      );
      return;
    }
    const totalDays = calculateLeaveDays(startDate, endDate, isHalfDay);
    const now = new Date().toISOString();
    setIsLoading(true);
    try {
      const newRequest: LeaveRequest = {
        id: `lr-${Date.now()}`,
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        total_days: totalDays,
        reason: reason || undefined,
        status: "pending",
        created_at: now,
        updated_at: now,
      };
      await createMutation.mutateAsync({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        total_days: totalDays,
        reason: reason || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setIsLoading(false);
    }
  };
  const durationText =
    startDate && endDate
      ? (() => {
          const days = calculateLeaveDays(startDate, endDate, isHalfDay);
          return `${days} day${days !== 1 ? "s" : ""}`;
        })()
      : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white/95 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Request Leave
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Leave request submitted successfully!
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                  disabled={isLoading || success}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || format(new Date(), "yyyy-MM-dd")}
                  required
                  disabled={isLoading || success}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                required
                disabled={isLoading || success}
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHalfDay"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30"
                disabled={isLoading || success}
              />
              <Label htmlFor="isHalfDay" className="cursor-pointer text-sm">
                Half-day leave
              </Label>
            </div>
            {durationText && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm text-slate-800">
                  <strong>Duration:</strong> {durationText}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for leave..."
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                disabled={isLoading || success}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={isLoading || success}
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
