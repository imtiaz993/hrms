"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseUser";
import { ExemptionRequest } from "@/types";
import { ExemptionRequestPopup } from "./ExemptionRequestPopup";
import { ExemptionRequestsList } from "@/components/employee/exemption-requests-list";

interface ExemptionRequestsProps {
  currentUser: any;
  cardBase: string;
}

export default function ExemptionRequests({ currentUser, cardBase }: ExemptionRequestsProps) {
  const [requests, setRequests] = useState<ExemptionRequest[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

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
          ) : (
            <ExemptionRequestsList
              requests={requests}
              employeeId={currentUser.id}
              employeeName={`${currentUser.first_name} ${currentUser.last_name}`}
              setRequests={setRequests}
            />
          )}
        </CardContent>
      </Card>

    </>
  );
}