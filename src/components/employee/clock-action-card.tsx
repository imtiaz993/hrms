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
import {
  Clock,
  Timer,
  LogIn,
  LogOut,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

interface ClockActionCardProps {
  status: TodayStatus;
  employeeId: string;
  standardHours: number;
  standardShiftStart: string;
  standardShiftEnd: string;
  onActionComplete?: () => void;
  employeeName: any;
  isLoading: boolean;
}

const SkeletonChip = () => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 animate-pulse">
    <span className="h-3.5 w-3.5 rounded bg-slate-200" />
    <span className="h-3 w-20 rounded bg-slate-200" />
  </span>
);

const SkeletonPanel = () => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 animate-pulse">
    <div className="mx-auto h-3 w-44 rounded bg-slate-200" />
    <div className="mx-auto mt-3 h-10 w-56 rounded bg-slate-200" />
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
        <div className="h-2 w-14 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
        <div className="h-2 w-16 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-20 rounded bg-slate-200" />
      </div>
    </div>
  </div>
);

export function ClockActionCard({
  status,
  employeeId,
  standardHours,
  standardShiftStart,
  standardShiftEnd,
  onActionComplete,
  employeeName,
  isLoading,
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

  const shiftLabel = useMemo(() => {
    if (!standardShiftStart) return "";
    if (standardShiftEnd) return `${standardShiftStart} – ${standardShiftEnd}`;
    return `${standardShiftStart}`;
  }, [standardShiftStart, standardShiftEnd]);

  useEffect(() => {
    if (status?.status !== "clocked_in" || !clockInValue) return;
    setTick(0);
    const intervalId = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [status?.status, clockInValue]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const elapsedLabel = useMemo(() => {
    if (status?.status !== "clocked_in" || !clockInValue) return "00:00:00";
    const start = new Date(clockInValue).getTime();
    const diffMs = Math.max(0, Date.now() - start);
    return formatDuration(diffMs);
  }, [status?.status, clockInValue, tick]);

  const workedLabel = useMemo(() => {
    if (!clockInValue || !clockOutValue) return null;
    const start = new Date(clockInValue).getTime();
    const end = new Date(clockOutValue).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return formatDuration(Math.max(0, end - start));
  }, [clockInValue, clockOutValue]);

  const handleClockIn = async () => {
    setMessage(null);
    try {
      const { error } = await supabase.from("time_entries").insert({
        employee_id: employeeId,
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
      const { error } = await supabase.rpc("calculate_total_hours", {
        p_time_entry_id: status.timeEntryId,
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

  const statusPill = useMemo(() => {
    const base =
      "rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap";
    if (status?.status === "clocked_in")
      return `${base} border-gray-200 bg-gray-50 text-gray-700`;
    if (status?.status === "completed")
      return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    return `${base} border-slate-200 bg-slate-50 text-slate-600`;
  }, [status?.status]);

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

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {isLoading ? (
                <>
                  <SkeletonChip />
                  <SkeletonChip />
                  <SkeletonChip />
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {todayLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                    <Timer className="h-3.5 w-3.5" />
                    Std: {standardHours}h
                  </span>

                  {shiftLabel ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      <Clock className="h-3.5 w-3.5" />
                      Shift: {shiftLabel}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="h-7 w-24 rounded-full border border-slate-200 bg-slate-50 animate-pulse" />
          ) : (
            <div className={statusPill}>
              {status.status === "clocked_in"
                ? "Active"
                : status.status === "completed"
                  ? "Completed"
                  : "Not Started"}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "success"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <>
            <SkeletonPanel />
            <div className="h-12 w-full rounded-xl bg-slate-200/70 animate-pulse" />
          </>
        ) : (
          <>
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
                      —
                    </p>
                  </div>
                </div>
              </div>
            ) : status.status === "completed" ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/70">
                  Total Worked Time
                </p>
                <p className="mt-2 text-4xl font-semibold tabular-nums text-emerald-900">
                  {workedLabel ?? "00:00:00"}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                  <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                    <p className="text-[11px] text-emerald-700/70">Clock In</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-900">
                      {clockInValue
                        ? format(new Date(clockInValue), "h:mm a")
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                    <p className="text-[11px] text-emerald-700/70">Clock Out</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-900">
                      {clockOutValue
                        ? format(new Date(clockOutValue), "h:mm a")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Shift completed
                </div>
              </div>
            ) : null}

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

            {status.status === "not_clocked_in" && isWeekend() && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                It’s weekend — clock-in is disabled.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
