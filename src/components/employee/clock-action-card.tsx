"use client";

import { useState, useEffect } from "react";
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
import { Clock, CheckCircle2 } from "lucide-react";

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
  const [isClockInLoading, setIsClockInLoading] = useState(false);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);

  const [employeeName, setEmployeeName] = useState<string>("");
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const getMinutesFromISO = (iso: string) => {
    const date = new Date(iso);
    return date.getHours() * 60 + date.getMinutes();
  };
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
          user.user_metadata?.full_name || user.email || "Employee"
        );
      }
    };
    fetchUser();
  }, []);

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

      setMessage({ type: "success", text: "Clocked in successfully!" });
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

      setMessage({
        type: "success",
        text: "Clocked out successfully! Total hours calculated.",
      });

      onActionComplete?.();
       await fetch("/api/send-notification/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          title: "Clock-out Alert",
          body: `${employeeName} has clocked in.`,
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

  const currentStatus = status?.status ?? "not_clocked_in";
  const currentTime = format(new Date(), "h:mm a");
  const isLoading = isClockInLoading || isClockOutLoading;
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
        <div className="rounded-2xl bg-slate-50/80 py-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Current Time
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {currentTime}
          </p>
        </div>

        {status.status === "not_clocked_in" && !isWeekend() && (
          <Button
            onClick={handleClockIn}
            disabled={isClockInLoading}
            className="w-full rounded-xl"
            size="lg"
          >
            <Clock className="mr-2 h-5 w-5" />
            {isClockInLoading ? "Clocking In..." : "Clock In"}
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
