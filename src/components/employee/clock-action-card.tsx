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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TodayStatus } from "@/types";
import { useClockIn, useClockOut } from "@/hooks/useTimeEntry";
import { format } from "date-fns";
import { Clock, CheckCircle2 } from "lucide-react";
import { useLocalData } from "@/lib/local-data";

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
  standardShiftEnd,
  onActionComplete,
}: ClockActionCardProps) {
  const { timeEntries } = useLocalData();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const handleClockIn = async () => {
    setMessage(null);
    try {
      await clockInMutation.mutateAsync({
        employeeId,
        standardHours,
        standardShiftStart,
      });
      setMessage({ type: "success", text: "Clocked in successfully!" });
      onActionComplete?.();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to clock in. Please try again.",
      });
    }
  };

  const handleClockOut = async () => {
    setMessage(null);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const entry = timeEntries.find(
        (item) => item.employee_id === employeeId && item.date === todayStr
      );

      if (!entry) {
        setMessage({
          type: "error",
          text: "No time entry found for today.",
        });
        return;
      }

      await clockOutMutation.mutateAsync({
        timeEntryId: entry.id,
        employeeId,
        standardHours,
        standardShiftEnd,
      });
      setMessage({ type: "success", text: "Clocked out successfully!" });
      onActionComplete?.();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to clock out. Please try again.",
      });
    }
  };

  const currentTime = format(new Date(), "h:mm a");
  const isLoading = clockInMutation.isPending || clockOutMutation.isPending;

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

        {status.status === "not_clocked_in" && (
          <Button
            onClick={handleClockIn}
            disabled={isLoading}
            className="w-full rounded-xl"
            size="lg"
          >
            <Clock className="mr-2 h-5 w-5" />
            {isLoading ? "Clocking In..." : "Clock In"}
          </Button>
        )}

        {status.status === "clocked_in" && (
          <Button
            onClick={handleClockOut}
            disabled={isLoading}
            className="w-full rounded-xl"
            size="lg"
            variant="destructive"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {isLoading ? "Clocking Out..." : "Clock Out"}
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
