"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { LeaveType, LeaveRequest } from "@/types";
import {
  parseISO,
  startOfDay,
  isBefore,
  differenceInCalendarDays,
  isAfter,
} from "date-fns";

interface LeaveRequestPopupProps {
  employeeId: string;
  onClose: () => void;
  leaves: any;
  setLeaves: any;
  onLeaveSubmitted?: () => void;
}

export function LeaveRequestPopup({
  leaves,
  setLeaves,
  employeeId,
  onClose,
  onLeaveSubmitted,
}: LeaveRequestPopupProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("paid");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function calculateLeaveDays(
    startDate: string,
    endDate: string,
    isHalfDay: boolean,
  ): number {
    if (isHalfDay) {
      return 0.5;
    }

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const days = differenceInCalendarDays(end, start) + 1;

    return days;
  }

  function hasOverlappingLeave(
    requests: LeaveRequest[],
    startDate: string,
    endDate: string,
  ): boolean {
    const newStart = parseISO(startDate);
    const newEnd = parseISO(endDate);

    return requests.some((req) => {
      if (req.status === "rejected") return false;

      const reqStart = parseISO(req.start_date);
      const reqEnd = parseISO(req.end_date);

      return (
        ((isAfter(newStart, reqStart) ||
          newStart.getTime() === reqStart.getTime()) &&
          (isBefore(newStart, reqEnd) ||
            newStart.getTime() === reqEnd.getTime())) ||
        ((isAfter(newEnd, reqStart) ||
          newEnd.getTime() === reqStart.getTime()) &&
          (isBefore(newEnd, reqEnd) ||
            newEnd.getTime() === reqEnd.getTime())) ||
        ((isBefore(newStart, reqStart) ||
          newStart.getTime() === reqStart.getTime()) &&
          (isAfter(newEnd, reqEnd) || newEnd.getTime() === reqEnd.getTime()))
      );
    });
  }

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

    if (
      hasOverlappingLeave(
        leaves.filter((l: any) => l.status !== "rejected"),
        startDate,
        endDate,
      )
    ) {
      setError(
        "You already have a pending or approved leave request for these dates.",
      );
      return;
    }

    const totalDays = calculateLeaveDays(startDate, endDate, isHalfDay);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("leave_requests")
        .insert([
          {
            employee_id: employeeId,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            is_half_day: isHalfDay,
            total_days: totalDays,
            reason: reason || null,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setLeaves((prev: any) => [...prev, data]);
      setSuccess(true);
      setTimeout(onClose, 1500);

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
            title: "Leave Request Submitted",
            body: `A new leave request has been submitted by ${employeeName}.`,
          }),
        });
      }
    } catch (err: any) {
      console.error("Error submitting leave request:", err);
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setIsLoading(false);
    }
  };

  const durationText =
    startDate && endDate
      ? `${calculateLeaveDays(startDate, endDate, isHalfDay)} day(s)`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Request Leave</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
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

            <div className="grid lg:grid-cols-2  sm:grid-cols-1 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div>
              <Label>Leave Type</Label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
              />
              <Label>Half Day</Label>
            </div>

            {durationText && (
              <p className="text-sm text-slate-700">
                <strong>Duration:</strong> {durationText}
              </p>
            )}

            <div>
              <Label>Reason</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
