"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseUser";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TodayStatus } from "@/types";
import { format } from "date-fns";
import { Clock, Timer, LogIn, LogOut, CalendarDays } from "lucide-react";

interface ClockActionCardProps {
  status: TodayStatus;
  employeeId: string;
  standardHours: number;
  standardShiftStart: string;
  standardShiftEnd: string;
  onActionComplete?: () => void;
  employeeName: any;
}

export function ClockActionCard({
  status,
  employeeId,
  standardHours,
  standardShiftStart,
  standardShiftEnd,
  onActionComplete,
  employeeName,
}: ClockActionCardProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  };

  const clockInValue =
    status?.timeIn || status?.clockIn || (status as any)?.clock_in || null;

  const clockOutValue =
    status?.timeOut || status?.clockOut || (status as any)?.clock_out || null;

  useEffect(() => {
    if (status?.status !== "clocked_in" || !clockInValue) return;
    setTick(0);
    const intervalId = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [status?.status, clockInValue]);

  const elapsedLabel = useMemo(() => {
    if (status?.status !== "clocked_in" || !clockInValue) return "00:00:00";

    const start = new Date(clockInValue).getTime();
    const diffMs = Math.max(0, Date.now() - start);

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [status?.status, clockInValue, tick]);

  const shiftLabel = useMemo(() => {
    if (!standardShiftStart) return "";
    if (standardShiftEnd) return `${standardShiftStart} – ${standardShiftEnd}`;
    return `${standardShiftStart}`;
  }, [standardShiftStart, standardShiftEnd]);

  const handleClockIn = async () => {
    setMessage(null);
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const { error } = await supabase.from("time_entries").insert({
        employee_id: employeeId,
        date: today,
        clock_in: now.toISOString(),
        standard_hours: standardHours,
        shift_start: standardShiftStart,
      });

      if (error) throw error;

      onActionComplete?.();

      await fetch("/api/send-notification/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          title: "Clock-in Alert",
          body: `${employeeName} has clocked in.`,
        }),
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to clock in" });
    }
  };

  const handleClockOut = async () => {
    if (!status) {
      setMessage({ type: "error", text: "No active time entry found." });
      return;
    }

    setIsClockOutLoading(true);
    setMessage(null);

    try {
      const now = new Date();

      const { error } = await supabase.rpc("calculate_total_hours", {
        p_time_entry_id: status.timeEntryId,
        p_clock_out: now.toISOString(),
      });

      if (error) throw error;

      onActionComplete?.();

      await fetch("/api/send-notification/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          title: "Clock-out Alert",
          body: `${employeeName} has clocked out.`,
        }),
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to clock out",
      });
    } finally {
      setIsClockOutLoading(false);
    }
  };

  const todayLabel = format(new Date(), "EEE, dd MMM");

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white/90 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900">
              Clock In / Clock Out
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Record your work hours for today
            </CardDescription>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {todayLabel}
              </span>
              {shiftLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  Shift: {shiftLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                <Timer className="h-3.5 w-3.5" />
                Std: {standardHours}h
              </span>
            </div>
          </div>

          <div
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold",
              status.status === "clocked_in"
                ? "border-gray-200 bg-gray-50 text-gray-700"
                : status.status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            {status.status === "clocked_in"
              ? "Active"
              : status.status === "completed"
                ? "Completed"
                : "Not Started"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "success"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Main hero panel */}
        {status.status === "clocked_in" ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-700/70">
              Elapsed Since Clock In
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-gray-900">
              {elapsedLabel}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-xl bg-white/70 border border-gray-100 p-3">
                <p className="text-[11px] text-gray-700/70">Clock In</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {clockInValue
                    ? format(new Date(clockInValue), "h:mm a")
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-gray-100 p-3">
                <p className="text-[11px] text-gray-700/70">Clock Out</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {clockOutValue
                    ? format(new Date(clockOutValue), "h:mm a")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Current Time
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-slate-900">
              {format(new Date(), "h:mm a")}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {status.status === "completed"
                ? "Your shift is already completed for today."
                : "Clock in to start tracking your hours."}
            </p>
          </div>
        )}

        {/* Actions */}
        {status.status === "not_clocked_in" && !isWeekend() && (
          <Button
            onClick={handleClockIn}
            className="w-full rounded-xl"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Clock In
          </Button>
        )}

        {status.status === "clocked_in" && (
          <Button
            onClick={handleClockOut}
            disabled={isClockOutLoading}
            className="w-full rounded-xl"
            size="lg"
            variant="destructive"
          >
            <LogOut className="mr-2 h-5 w-5" />
            {isClockOutLoading ? "Clocking Out..." : "Clock Out"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
