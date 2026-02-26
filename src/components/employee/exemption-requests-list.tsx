"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExemptionRequest, ExemptionStatus } from "@/types";
import { supabase } from "@/lib/supabaseUser";
import { format } from "date-fns";
import { parsePKT } from "@/lib/time-utils";
import { Eye, X, XCircle, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ExemptionRequestsListProps {
    requests: ExemptionRequest[];
    employeeId: string;
    setRequests: any;
    employeeName: string;
}

const statusConfig: Record<
    ExemptionStatus,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "success" | "warning";
    }
> = {
    pending: {
        label: "Pending",
        variant: "secondary",
    },
    approved: {
        label: "Approved",
        variant: "success",
    },
    rejected: {
        label: "Rejected",
        variant: "destructive",
    },
};

export function ExemptionRequestsList({
    requests,
    employeeId,
    employeeName,
    setRequests,
}: ExemptionRequestsListProps) {
    const [selectedRequest, setSelectedRequest] = useState<ExemptionRequest | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleCancel = async (requestId: string) => {
        if (cancellingId) return;
        setCancellingId(requestId);
        try {
            const { error } = await supabase
                .from("exemption_requests")
                .delete()
                .eq("id", requestId);

            if (error) throw error;

            await fetch("/api/admin/send-notification-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adminNotification: true,
                    employeeId: "",
                    title: "Exemption Request Cancelled",
                    body: `${employeeName} has cancelled an exemption request.`,
                }),
            });

            addToast({
                title: "Success",
                description: "Request cancelled successfully",
                variant: "success",
            });

            setRequests((prev: ExemptionRequest[]) =>
                prev.filter((req) => req.id !== requestId)
            );
        } catch (err: any) {
            addToast({
                title: "Error",
                description: err.message || "Failed to cancel request",
                variant: "destructive",
            });
        } finally {
            setCancellingId(null);
        }
    };

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600">
                    <ChevronRight className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">
                    No exemption requests yet
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Times (New)
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {requests.map((req) => (
                                <tr
                                    key={req.id}
                                    className="transition-colors hover:bg-slate-50/70"
                                >
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                        {format(parsePKT(req.date), "MMM dd, yyyy")}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                                        <div className="flex flex-col">
                                            <span>
                                                In:{" "}
                                                {req.new_clock_in
                                                    ? format(parsePKT(req.new_clock_in), "HH:mm")
                                                    : "--:--"}
                                            </span>
                                            <span>
                                                Out:{" "}
                                                {req.new_clock_out
                                                    ? format(parsePKT(req.new_clock_out), "HH:mm")
                                                    : "--:--"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge
                                            variant={statusConfig[req.status].variant}
                                            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                        >
                                            {statusConfig[req.status].label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right space-x-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => setSelectedRequest(req)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        {req.status === "pending" && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                onClick={() => handleCancel(req.id)}
                                                disabled={cancellingId === req.id}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Popup */}
            {selectedRequest &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedRequest(null)}
                    >
                        <Card
                            className="w-full max-w-lg relative bg-white shadow-xl rounded-2xl border-0 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4 px-6">
                                <CardTitle className="text-base font-semibold text-slate-900">
                                    Exemption Request Details
                                </CardTitle>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setSelectedRequest(null)}
                                >
                                    <X className="h-4 w-4 text-slate-500" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-8">

                                    {/* Header Info Section */}
                                    <div className="flex items-start justify-between gap-6 pb-4 border-b border-slate-100">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                Date
                                            </p>
                                            <p className="mt-1 text-base font-semibold text-slate-900">
                                                {format(parsePKT(selectedRequest.date), "EEEE, MMM dd, yyyy")}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                Status
                                            </p>
                                            <div className="mt-1">
                                                <Badge
                                                    variant={statusConfig[selectedRequest.status].variant}
                                                    className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                                                >
                                                    {statusConfig[selectedRequest.status].label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Comparison Section */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                Old Times
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Clock In</span>
                                                    <span className="font-medium text-slate-900">
                                                        {selectedRequest.old_clock_in
                                                            ? format(parsePKT(selectedRequest.old_clock_in), "HH:mm")
                                                            : "--:--"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Clock Out</span>
                                                    <span className="font-medium text-slate-900">
                                                        {selectedRequest.old_clock_out
                                                            ? format(parsePKT(selectedRequest.old_clock_out), "HH:mm")
                                                            : "--:--"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                                                New Times
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-blue-500 font-medium">Clock In</span>
                                                    <span className="font-bold text-blue-700">
                                                        {selectedRequest.new_clock_in
                                                            ? format(parsePKT(selectedRequest.new_clock_in), "HH:mm")
                                                            : "--:--"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-500 font-medium">Clock Out</span>
                                                    <span className="font-bold text-blue-700">
                                                        {selectedRequest.new_clock_out
                                                            ? format(parsePKT(selectedRequest.new_clock_out), "HH:mm")
                                                            : "--:--"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason Section */}
                                    <div>
                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            Reason
                                        </p>
                                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-sm text-slate-700 leading-relaxed shadow-inner">
                                            {selectedRequest.reason}
                                        </div>
                                    </div>

                                    {/* Admin Comment (Optional) */}
                                    {selectedRequest.admin_comment && (
                                        <div>
                                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                                                Admin Comment
                                            </p>
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 italic shadow-sm">
                                                {selectedRequest.admin_comment}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </CardContent>

                        </Card>
                    </div>,
                    document.body
                )}
        </>
    );
}
