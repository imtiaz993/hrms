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
import { Clock, CheckCircle2, Timer } from "lucide-react";

interface ClockActionCardProps {
  status: TodayStatus;
  employeeId: string;
  standardHours: number;
  standardShiftStart: string;
  standardShiftEnd: string;
  onActionComplete?: () => void;
}

export function ClockActionCard({
  status,
  employeeId,
  standardHours,
  standardShiftStart,
  onActionComplete,
}: ClockActionCardProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState<string>("");

  // Live tick for elapsed time (updates every 30s; change to 1s if you want)
  const [tick, setTick] = useState(0);

  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmployeeName(
          user.user_metadata?.full_name || user.email || "Employee",
        );
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (status?.status !== "clocked_in") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [status?.status]);

  const clockInValue =
    status?.timeIn || status?.clockIn || (status as any)?.clock_in || null;

  const elapsedLabel = useMemo(() => {
    if (status?.status !== "clocked_in" || !clockInValue) return null;

    const start = new Date(clockInValue).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - start);

    const totalSeconds = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [status?.status, clockInValue, tick]);

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

  useEffect(() => {
    // Only run when actively clocked in and we have a start time
    if (status?.status !== "clocked_in" || !clockInValue) return;

    // Force immediate render (no 1s delay on first paint)
    setTick(0);

    const intervalId = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    // Cleanup on unmount / status change
    return () => {
      window.clearInterval(intervalId);
    };
  }, [status?.status, clockInValue]);

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Clock In / Clock Out
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Record your work hours for today
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "success"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* If clocked in -> show elapsed since clock in (updates live) */}
        {status?.status === "clocked_in" && (
          <div className="rounded-2xl bg-indigo-50/70 py-4 text-center">
            <p className="mt-1 text-3xl font-semibold text-indigo-900">
              {elapsedLabel ?? "00:00"}
            </p>
          </div>
        )}

        {status.status === "not_clocked_in" && !isWeekend() && (
          <Button
            onClick={handleClockIn}
            className="w-full rounded-xl"
            size="lg"
          >
            <Clock className="mr-2 h-5 w-5" />
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
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {isClockOutLoading ? "Clocking Out..." : "Clock Out"}
          </Button>
        )}

        {status.status === "completed" && (
          <div className="rounded-2xl bg-emerald-50/80 p-4 text-center text-sm font-medium text-emerald-700">
            You&apos;ve completed your shift for today!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
