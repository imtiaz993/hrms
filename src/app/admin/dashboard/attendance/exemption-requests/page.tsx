"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseUser";
import { ExemptionRequest, Employee } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, XCircle, Clock, User, Calendar, FileText, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/time-utils";

export default function AdminExemptionRequestsPage() {
    const [requests, setRequests] = useState<(ExemptionRequest & { employees: Employee })[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { addToast } = useToast();

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("exemption_requests")
                .select("*, employees(*)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId: string, action: "approved" | "rejected") => {
        setProcessingId(requestId);
        try {
            const request = requests.find(r => r.id === requestId);
            if (!request) return;

            if (action === "approved") {
                // 1. Calculate total hours for the new times
                let total_hours = 0;
                if (request.new_clock_in && request.new_clock_out) {
                    const start = new Date(request.new_clock_in);
                    const end = new Date(request.new_clock_out);
                    total_hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (total_hours < 0) total_hours = 0;
                }

                // 2. Update time_entries table
                // Find existing entry or insert new
                const { data: existingEntry } = await supabase
                    .from("time_entries")
                    .select("id")
                    .eq("employee_id", request.employee_id)
                    .eq("date", request.date)
                    .maybeSingle();

                const entryPayload = {
                    employee_id: request.employee_id,
                    date: request.date,
                    clock_in: request.new_clock_in,
                    clock_out: request.new_clock_out,
                    is_late: request.is_late,
                    is_early_leave: request.is_early_leave,
                    total_hours: total_hours,
                    updated_at: new Date().toISOString()
                };

                if (existingEntry) {
                    await supabase.from("time_entries").update(entryPayload).eq("id", existingEntry.id);
                } else {
                    await supabase.from("time_entries").insert([{ ...entryPayload, created_at: new Date().toISOString() }]);
                }
            }

            // 3. Update request status
            const { error: updateError } = await supabase
                .from("exemption_requests")
                .update({ status: action, updated_at: new Date().toISOString() })
                .eq("id", requestId);

            if (updateError) throw updateError;

            // 4. Send notification to user
            await fetch("/api/admin/send-notification-admin/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: request.employee_id,
                    title: `Exemption Request ${action === "approved" ? "Approved" : "Rejected"}`,
                    body: `Your exemption request for ${request.date} has been ${action}.`,
                }),
            });

            addToast({
                title: "Success",
                description: `Request ${action} successfully`,
                variant: "success",
            });
            fetchRequests();
        } catch (err: any) {
            addToast({
                title: "Error",
                description: err.message || "Failed to process request",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const statusConfig = {
        pending: { label: "Pending", variant: "secondary" as const },
        approved: { label: "Approved", variant: "success" as const },
        rejected: { label: "Rejected", variant: "destructive" as const },
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Exemption Requests</h1>
                <p className="text-gray-600 mt-1">Manage employee time entry correction requests</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : requests.length === 0 ? (
                <Card className="p-12 text-center text-gray-500">
                    No exemption requests found.
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requests.map((req) => (
                        <Card key={req.id} className="overflow-hidden border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                            {req.employees?.first_name?.charAt(0)}{req.employees?.last_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold">
                                                {req.employees?.first_name} {req.employees?.last_name}
                                            </CardTitle>
                                            <p className="text-xs text-slate-500">{req.employees?.department}</p>
                                        </div>
                                    </div>
                                    <Badge variant={statusConfig[req.status].variant}>
                                        {statusConfig[req.status].label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Date
                                        </p>
                                        <p className="text-sm font-medium">{format(parseISO(req.date), "MMM dd, yyyy")}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Requested Times
                                        </p>
                                        <p className="text-sm font-medium">
                                            {req.new_clock_in ? format(parseISO(req.new_clock_in), "HH:mm") : "--:--"} -
                                            {req.new_clock_out ? format(parseISO(req.new_clock_out), "HH:mm") : "--:--"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reason</p>
                                            <p className="text-sm text-slate-700">{req.reason}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="text-[10px] text-slate-400 p-2 bg-slate-50 rounded border">
                                        <span className="font-bold">Original:</span><br />
                                        In: {req.old_clock_in ? format(parseISO(req.old_clock_in), "HH:mm") : "N/A"}<br />
                                        Out: {req.old_clock_out ? format(parseISO(req.old_clock_out), "HH:mm") : "N/A"}
                                    </div>
                                    <div className="text-[10px] text-blue-600 p-2 bg-blue-50 rounded border border-blue-100">
                                        <span className="font-bold">New:</span><br />
                                        Late: {req.is_late ? "Yes" : "No"}<br />
                                        Early Leave: {req.is_early_leave ? "Yes" : "No"}
                                    </div>
                                </div>

                                {req.status === "pending" && (
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                            onClick={() => handleAction(req.id, "approved")}
                                            disabled={!!processingId}
                                        >
                                            {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                            Approve
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAction(req.id, "rejected")}
                                            disabled={!!processingId}
                                        >
                                            <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
