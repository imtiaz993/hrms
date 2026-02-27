"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseUser";
import { TimeEntry, ExemptionRequest } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { Loader2, AlertCircle } from "lucide-react";
import { getCurrentDate, formatISOPlain, parseISOPlain } from "@/lib/time-utils";

interface ExemptionRequestPopupProps {
  currentUser: any;
  onClose: () => void;
  onSuccess: () => void;
  existingRequests: ExemptionRequest[];
}

export function ExemptionRequestPopup({
  currentUser,
  onClose,
  onSuccess,
  existingRequests,
}: ExemptionRequestPopupProps) {
  const [selectedDate, setSelectedDate] = useState(format(getCurrentDate(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const [fetchingEntry, setFetchingEntry] = useState(false);
  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [newClockIn, setNewClockIn] = useState("");
  const [newClockOut, setNewClockOut] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      fetchEntry();

      // Check if there's already a pending request for this date
      const hasPending = existingRequests.some(
        (r) => r.date === selectedDate && r.status === "pending"
      );
      if (hasPending) {
        setError("You already have a pending request for this date.");
      } else {
        setError("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, existingRequests]);

  const fetchEntry = async () => {
    setFetchingEntry(true);
    setEntry(null);

    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", currentUser.id)
        .eq("date", selectedDate)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEntry(data);
        setNewClockIn(data.clock_in ? format(parseISOPlain(data.clock_in), "HH:mm") : "");
        setNewClockOut(data.clock_out ? format(parseISOPlain(data.clock_out), "HH:mm") : "");
      } else {
        setNewClockIn("");
        setNewClockOut("");
      }
    } catch (err) {
      console.error("Error fetching entry:", err);
    } finally {
      setFetchingEntry(false);
    }
  };

  const calculateFlags = (ci: string, co: string) => {
    let is_late = false;
    let is_early_leave = false;

    if (ci && currentUser.standard_shift_start) {
      if (ci > currentUser.standard_shift_start.substring(0, 5)) is_late = true;
    }

    if (co && currentUser.standard_shift_end) {
      if (co < currentUser.standard_shift_end.substring(0, 5)) is_early_leave = true;
    }

    return { is_late, is_early_leave };
  };

  const handleSubmit = async () => {
    setError("");


    const hasPending = existingRequests.some(
      (r) => r.date === selectedDate && r.status === "pending"
    );
    if (hasPending) {
      setError("You already have a pending request for this date.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the exemption.");
      return;
    }

    setLoading(true);
    try {
      // Store in plain offset format
      const fullNewIn = newClockIn ? `${selectedDate}T${newClockIn}:00` : null;
      const fullNewOut = newClockOut ? `${selectedDate}T${newClockOut}:00` : null;

      const { is_late, is_early_leave } = calculateFlags(newClockIn, newClockOut);

      const nowplain = formatISOPlain(getCurrentDate());

      const payload = {
        employee_id: currentUser.id,
        date: selectedDate,
        old_clock_in: entry?.clock_in || null,
        old_clock_out: entry?.clock_out || null,
        new_clock_in: fullNewIn,
        new_clock_out: fullNewOut,
        is_late,
        is_early_leave,
        reason,
        status: "pending",
        created_at: nowplain,
        updated_at: nowplain,
      };

      const { error: insertError } = await supabase.from("exemption_requests").insert([payload]);
      if (insertError) throw insertError;

      // Notification to admin
      await fetch("/api/admin/send-notification-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotification: true,
          employeeId: "", // explicit blank to avoid "missing field" logic if any
          title: "New Exemption Request",
          body: `${currentUser.first_name} ${currentUser.last_name} has submitted an exemption request for ${selectedDate}.`,
        }),
      });

      addToast({
        title: "Success",
        description: "Exemption request submitted successfully",
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        title: "Error",
        description: err?.message || "Failed to submit request",
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
          <DialogTitle>New Exemption Request</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Select Date</Label>
            <Input
              id="date"
              type="date"
              max={format(getCurrentDate(), "yyyy-MM-dd")}
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            {fetchingEntry ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newIn">Requested Clock In</Label>
                    <Input
                      id="newIn"
                      type="time"
                      value={newClockIn}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClockIn(e.target.value)}
                    />
                    <div className="text-[10px] text-slate-400">
                      Current: {entry?.clock_in ? format(parseISOPlain(entry.clock_in), "HH:mm") : "N/A"}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newOut">Requested Clock Out</Label>
                    <Input
                      id="newOut"
                      type="time"
                      value={newClockOut}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClockOut(e.target.value)}
                    />
                    <div className="text-[10px] text-slate-400">
                      Current: {entry?.clock_out ? format(parseISOPlain(entry.clock_out), "HH:mm") : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Exemption</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly explain why you need this correction..."
                    value={reason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}