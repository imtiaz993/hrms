"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeaveType, LeaveRequest } from "@/types";
import {
  useCreateLeaveRequest,
  calculateLeaveDays,
  hasOverlappingLeave,
} from "@/hooks/useLeave";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface LeaveRequestFormProps {
  employeeId: string;
  existingRequests: LeaveRequest[];
}

export function LeaveRequestForm({
  employeeId,
  existingRequests,
}: LeaveRequestFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("paid");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const createMutation = useCreateLeaveRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMessage("");

    if (!startDate || !endDate) {
      setValidationError("Please select start and end dates.");
      return;
    }

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const today = startOfDay(new Date());

    if (isBefore(start, today)) {
      setValidationError("Start date cannot be in the past.");
      return;
    }

    if (isBefore(end, start)) {
      setValidationError("End date must be on or after start date.");
      return;
    }
    if (isHalfDay && startDate !== endDate) {
      setValidationError("Half-day leave can only be for a single day.");
      return;
    }

    if (hasOverlappingLeave(existingRequests, startDate, endDate)) {
      setValidationError(
        "You already have a pending or approved leave request for these dates."
      );
    }
    const totalDays = calculateLeaveDays(startDate, endDate, isHalfDay);

    try {
      await createMutation.mutateAsync({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        total_days: totalDays,
        reason: reason || undefined,
      });

      setSuccessMessage("Leave request submitted successfully!");
      setStartDate("");
      setEndDate("");
      setReason("");
      setIsHalfDay(false);
    } catch (error: any) {
      setValidationError(
        error.message || "Failed to submit leave request. Please try again."
      );
    }
  };

  const calculateDaysPreview = () => {
    if (!startDate || !endDate) return null;

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    if (isBefore(end, start)) return null;

    const days = calculateLeaveDays(startDate, endDate, isHalfDay);
    return `${days} day${days !== 1 ? "s" : ""}`;
  };
  const durationPreview = calculateDaysPreview();

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm";

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          Request Leave
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Submit a new leave request to your manager for approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {validationError && (
            <Alert variant="destructive" className="border-rose-200 bg-rose-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {validationError}
              </AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert
              variant="success"
              className="border-emerald-200 bg-emerald-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="startDate"
                className="text-sm font-medium text-slate-700"
              >
                Start Date <span className="text-rose-500">*</span>
              </Label>
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
                disabled={createMutation.isPending}
                className="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                You can request leave starting from today or a future date.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="endDate"
                className="text-sm font-medium text-slate-700"
              >
                End Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), "yyyy-MM-dd")}
                required
                disabled={createMutation.isPending}
                className="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                For single-day leave, choose the same start and end date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <Label
                htmlFor="leaveType"
                className="text-sm font-medium text-slate-700"
              >
                Leave Type <span className="text-rose-500">*</span>
              </Label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={createMutation.isPending}
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  id="isHalfDay"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={createMutation.isPending}
                />
                <span>Half-day leave</span>
              </label>
            </div>
          </div>

          {durationPreview && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-900">
              <p>
                <strong>Duration:</strong> {durationPreview}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label
              htmlFor="reason"
              className="text-sm font-medium text-slate-700"
            >
              Reason <span className="text-slate-400 text-xs">(optional)</span>
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a short explanation (e.g. family event, medical appointment)..."
              className="flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={createMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            className="mt-2 w-full rounded-full text-sm font-semibold"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Submitting…" : "Submit Leave Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
