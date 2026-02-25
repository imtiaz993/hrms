"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseUser";
import { Employee, TimeEntry } from "@/types";
import { format, isAfter } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { getCurrentTime, toPKTISO, parsePKT } from "@/lib/time-utils";

interface AdjustEntryPopupProps {
  onClose: () => void;
  employees: Employee[];
}

export function AdjustEntryPopup({ onClose, employees }: AdjustEntryPopupProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(getCurrentTime(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [fetchingEntry, setFetchingEntry] = useState(false);
  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const { addToast } = useToast();

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  useEffect(() => {
    if (selectedEmployeeId && selectedDate) {
      fetchEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, selectedDate]);

  const fetchEntry = async () => {
    setFetchingEntry(true);
    setEntry(null);
    setClockIn("");
    setClockOut("");

    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", selectedEmployeeId)
        .eq("date", selectedDate)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEntry(data);
        setClockIn(data.clock_in ? format(parsePKT(data.clock_in), "HH:mm") : "");
        setClockOut(data.clock_out ? format(parsePKT(data.clock_out), "HH:mm") : "");
      }
    } catch (err) {
      console.error("Error fetching entry:", err);
    } finally {
      setFetchingEntry(false);
    }
  };

  const calculateFlags = (ci: string, co: string) => {
    if (!selectedEmployee) return { is_late: false, is_early_leave: false };

    let is_late = false;
    let is_early_leave = false;

    if (ci) {
      const standardStart = selectedEmployee.standard_shift_start; // "09:00:00"
      if (ci > standardStart.substring(0, 5)) is_late = true;
    }

    if (co) {
      const standardEnd = selectedEmployee.standard_shift_end; // "18:00:00"
      if (co < standardEnd.substring(0, 5)) is_early_leave = true;
    }

    return { is_late, is_early_leave };
  };

  const { is_late, is_early_leave } = calculateFlags(clockIn, clockOut);

  const handleUpdate = async () => {
    if (!selectedEmployeeId || !selectedDate) return;
    setLoading(true);

    try {
      const fullClockIn = clockIn ? `${selectedDate} ${clockIn}:00` : null;
      const fullClockOut = clockOut ? `${selectedDate} ${clockOut}:00` : null;

      let total_hours = null;
      if (fullClockIn && fullClockOut) {
        // Parse as PKT consistently
        const start = parsePKT(fullClockIn.replace(" ", "T") + "+05:00");
        const end = parsePKT(fullClockOut.replace(" ", "T") + "+05:00");
        total_hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }

      const payload = {
        employee_id: selectedEmployeeId,
        date: selectedDate,
        clock_in: fullClockIn ? fullClockIn.replace(" ", "T") + "+05:00" : null,
        clock_out: fullClockOut ? fullClockOut.replace(" ", "T") + "+05:00" : null,
        is_late,
        is_early_leave,
        total_hours: total_hours && total_hours > 0 ? total_hours : 0,
        updated_at: toPKTISO(getCurrentTime()),
      };

      let error;
      if (entry) {
        const { error: updateError } = await supabase.from("time_entries").update(payload).eq("id", entry.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("time_entries")
          .insert([{ ...payload, created_at: toPKTISO(getCurrentTime()) }]);
        error = insertError;
      }

      if (error) throw error;

      // Send notification
      await fetch("/api/admin/send-notification-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          adminNotification: false,
          title: "Attendance Updated",
          body: `Your attendance record for ${selectedDate} has been updated by Admin.`,
        }),
      });

      addToast({
        title: "Success",
        description: "Attendance adjusted successfully",
        variant: "success",
      });

      onClose();
    } catch (err: any) {
      addToast({
        title: "Error",
        description: err?.message || "Failed to adjust attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Attendance Entry</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="employee">Select Employee</Label>
            <select
              id="employee"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Choose an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Select Date</Label>
            <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          {selectedEmployeeId && selectedDate && (
            <div className="border-t pt-4 space-y-4">
              {fetchingEntry ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="clockIn">Clock In</Label>
                      <Input id="clockIn" type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clockOut">Clock Out</Label>
                      <Input id="clockOut" type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={is_late}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label className="text-sm">Is Late</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={is_early_leave}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label className="text-sm">Is Early Leave</Label>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Shift: {selectedEmployee?.standard_shift_start} - {selectedEmployee?.standard_shift_end}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || !selectedEmployeeId || !selectedDate || fetchingEntry}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {entry ? "Update Entry" : "Create Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}