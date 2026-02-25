"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, History, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseUser";
import { ExemptionRequest } from "@/types";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { ExemptionRequestPopup } from "./ExemptionRequestPopup";

interface ExemptionRequestsProps {
  currentUser: any;
  cardBase: string;
}

export default function ExemptionRequests({ currentUser, cardBase }: ExemptionRequestsProps) {
  const [requests, setRequests] = useState<ExemptionRequest[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  const { addToast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("exemption_requests")
        .select("*")
        .eq("employee_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching exemption requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchRequests();
    }
  }, [currentUser?.id]);

  const handleCancel = async (requestId: string) => {
    try {
      const { error } = await supabase.from("exemption_requests").delete().eq("id", requestId);

      if (error) throw error;

      // Send notification to admin
      await fetch("/api/admin/send-notification-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotification: true,
          employeeId: "",
          title: "Exemption Request Cancelled",
          body: `${currentUser.first_name} ${currentUser.last_name} has cancelled an exemption request.`,
        }),
      });

      addToast({
        title: "Success",
        description: "Request cancelled successfully",
        variant: "success",
      });

      fetchRequests();
    } catch (err: any) {
      addToast({
        title: "Error",
        description: err?.message || "Failed to cancel request",
        variant: "destructive",
      });
    }
  };

  const statusConfig: Record<
    string,
    { label: string; variant: "secondary" | "success" | "destructive" }
  > = {
    pending: { label: "Pending", variant: "secondary" },
    approved: { label: "Approved", variant: "success" },
    rejected: { label: "Rejected", variant: "destructive" },
  };

  return (
    <>
      {showPopup && (
        <ExemptionRequestPopup
          currentUser={currentUser}
          onClose={() => setShowPopup(false)}
          onSuccess={fetchRequests}
          existingRequests={requests}
        />
      )}

      <Card className={cardBase}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            Exemption Requests
          </CardTitle>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-3 text-xs"
            onClick={() => setShowPopup(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            New Request
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed">
              <p className="text-sm text-slate-500">No requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="p-3 border rounded-xl bg-white shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">
                        {req.date ? format(parseISO(req.date), "MMM dd, yyyy") : "--"}
                      </div>
                      <div className="text-xs text-slate-500">{req.reason}</div>
                    </div>

                    <Badge variant={(statusConfig[req.status]?.variant ?? "secondary") as any}>
                      {statusConfig[req.status]?.label ?? req.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div
                        className="text-slate-400 mb-1 font-medium uppercase tracking-tight"
                        style={{ fontSize: "10px" }}
                      >
                        Old Times
                      </div>
                      <div className="flex flex-col">
                        <span>
                          In:{" "}
                          {req.old_clock_in ? format(parseISO(req.old_clock_in), "HH:mm") : "--:--"}
                        </span>
                        <span>
                          Out:{" "}
                          {req.old_clock_out
                            ? format(parseISO(req.old_clock_out), "HH:mm")
                            : "--:--"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-blue-50 rounded-lg">
                      <div
                        className="text-blue-400 mb-1 font-medium uppercase tracking-tight"
                        style={{ fontSize: "10px" }}
                      >
                        New Times
                      </div>
                      <div className="flex flex-col text-blue-700">
                        <span>
                          In:{" "}
                          {req.new_clock_in ? format(parseISO(req.new_clock_in), "HH:mm") : "--:--"}
                        </span>
                        <span>
                          Out:{" "}
                          {req.new_clock_out
                            ? format(parseISO(req.new_clock_out), "HH:mm")
                            : "--:--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                        onClick={() => handleCancel(req.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Cancel Request
                      </Button>
                    </div>
                  )}

                  {req.admin_comment && (
                    <div className="text-xs p-2 bg-slate-50 rounded-lg border-l-2 border-slate-300">
                      <span className="font-semibold">Admin:</span> {req.admin_comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}