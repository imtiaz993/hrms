"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseUser";
import { ExemptionRequest, Employee } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/components/ui/toast";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getCurrentTime, toPKTISO, parsePKT } from "@/lib/time-utils";

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
      setRequests((data as any) || []);
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
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      if (action === "approved") {
        // 1) Calculate total hours for the new times
        let total_hours = 0;
        if (request.new_clock_in && request.new_clock_out) {
          const start = new Date(request.new_clock_in);
          const end = new Date(request.new_clock_out);
          total_hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (total_hours < 0) total_hours = 0;
        }

        // 2) Update time_entries table (update if exists, else insert)
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
          total_hours,
          updated_at: toPKTISO(getCurrentTime()),
        };

        if (existingEntry) {
          await supabase.from("time_entries").update(entryPayload).eq("id", (existingEntry as any).id);
        } else {
          await supabase
            .from("time_entries")
            .insert([{ ...entryPayload, created_at: toPKTISO(getCurrentTime()) }]);
        }
      }

      // 3) Update request status
      const { error: updateError } = await supabase
        .from("exemption_requests")
        .update({ status: action, updated_at: toPKTISO(getCurrentTime()) })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // 4) Send notification to user
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
        description: err?.message || "Failed to process request",
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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const fullName = `${req.employees?.first_name} ${req.employees?.last_name}`.toLowerCase();

      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        (req.employees?.employee_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.reason || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const total = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize);
  const showingFrom = total === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, total);

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Exemption Requests</h1>
        <p className="text-slate-500">Manage and process employee attendance correction requests</p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white/50 rounded-2xl border border-slate-100 italic text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          Fetching requests...
        </div>
      ) : total === 0 ? (
        <Card className="p-16 text-center border-slate-200/60 shadow-sm bg-white/50">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No requests found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters to find what you're looking for."
              : "New requests will appear here once submitted by employees."}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="link"
              className="mt-4 text-blue-600"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear all filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/80">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Employee</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Correction</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Reason</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/60">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white shadow-sm">
                            {getInitials(req.employees?.first_name, req.employees?.last_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {req.employees?.first_name} {req.employees?.last_name}
                            </div>
                            <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                              {req.employees?.department}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {format(parsePKT(req.date), "MMM dd, yyyy")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {format(parsePKT(req.date), "EEEE")}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-400 w-7">New:</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {req.new_clock_in ? format(parsePKT(req.new_clock_in), "HH:mm") : "--"} -{" "}
                              {req.new_clock_out ? format(parsePKT(req.new_clock_out), "HH:mm") : "--"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-slate-400 w-7">Old:</span>
                            <span className="text-slate-500 line-through">
                              {req.old_clock_in ? format(parsePKT(req.old_clock_in), "HH:mm") : "N/A"} -{" "}
                              {req.old_clock_out ? format(parsePKT(req.old_clock_out), "HH:mm") : "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className="max-w-[200px] truncate text-slate-600 text-xs italic"
                          title={req.reason}
                        >
                          &ldquo;{req.reason}&rdquo;
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={statusConfig[req.status].variant}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm"
                        >
                          {statusConfig[req.status].label}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
                              onClick={() => handleAction(req.id, "approved")}
                              disabled={!!processingId}
                            >
                              {processingId === req.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                              onClick={() => handleAction(req.id, "rejected")}
                              disabled={!!processingId}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Processed on {format(parsePKT((req as any).updated_at || (req as any).created_at), "MMM dd")}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{showingFrom}</span> to{" "}
              <span className="font-semibold text-slate-900">{showingTo}</span> of{" "}
              <span className="font-semibold text-slate-900">{total}</span> total entries
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-xs font-medium text-slate-700 min-w-[3rem] text-center">
                  {safePage} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}