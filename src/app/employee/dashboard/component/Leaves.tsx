"use client";
import { LeaveRequestPopup } from "@/components/employee/leave-request-popup";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ClipboardList } from "lucide-react";
import React, { useEffect, useState } from "react";

const LeavesSkeleton = () => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="h-3 w-40 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-24 rounded bg-slate-200" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="h-3 w-56 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-32 rounded bg-slate-200" />
      </div>
    </div>
  );
};

const Leaves = ({
  cardBase,
  sickLeaves,
  casualLeaves,
  totalSickLeaves,
  totalCasualLeaves,
  leaveRequests,
  currentUser,
  setLeaveRequests,
  isLoading = false,
}: any) => {
  const [showLeaveRequest, setShowLeaveRequest] = useState(false);

  // ✅ local state so UI updates instantly after submit/cancel
  const [localSickLeaves, setLocalSickLeaves] = useState<number>(sickLeaves);
  const [localCasualLeaves, setLocalCasualLeaves] = useState<number>(casualLeaves);

  // keep in sync if parent props change later
  useEffect(() => {
    setLocalSickLeaves(sickLeaves);
  }, [sickLeaves]);

  useEffect(() => {
    setLocalCasualLeaves(casualLeaves);
  }, [casualLeaves]);

  return (
    <>
      {showLeaveRequest && (
        <LeaveRequestPopup
          employeeId={currentUser.id}
          employeeName={currentUser.first_name}
          currentSickLeaves={localSickLeaves}
          currentCasualLeaves={localCasualLeaves}
          onClose={() => setShowLeaveRequest(false)}
          leaves={leaveRequests}
          setLeaves={setLeaveRequests}
          onLeaveSubmitted={({ leaveType, totalDays }) => {
            // ✅ subtract only for sick/paid (unpaid does not reduce balance)
            if (leaveType === "sick") {
              setLocalSickLeaves((prev) => Math.max(0, Number(prev) - Number(totalDays)));
            } else if (leaveType === "paid") {
              // treating "paid" as "casual" based on your UI label
              setLocalCasualLeaves((prev) => Math.max(0, Number(prev) - Number(totalDays)));
            }
          }}
        />
      )}

      <Card className={cardBase} >
        <div className="flex flex-row justify-between" >
             <CardHeader className="flex  items-start justify-between pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 ">
            Leaves
          </CardTitle>
           <p className="text-[11px] text-slate-400">
              Sick Leaves:{" "}
              <span className="text-slate-700 font-medium">
                {localSickLeaves}/{totalSickLeaves}
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Casual Leaves:{" "}
              <span className="text-slate-700 font-medium">
                {localCasualLeaves}/{totalCasualLeaves}
              </span>
            </p>

          
        </CardHeader>
        <div className="flex flex-col items-end gap-2 space-y-1.5  p-6">
           
            <Button
              onClick={() => setShowLeaveRequest(true)}
              size="sm"
              variant="outline"
              className="rounded-full px-3 text-xs h-8"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Request leave
            </Button>
            
          </div>
        </div>
     

        <CardContent>
          {/* Loading */}
          {isLoading && <LeavesSkeleton />}

          {/* Data */}
          {!isLoading && leaveRequests && leaveRequests.length > 0 ? (
            <LeaveRequestsList
              requests={leaveRequests}
              employeeId={currentUser.id}
              employeeName={currentUser.first_name}
              setLeaves={setLeaveRequests}
              onLeaveCancelled={({ leaveType, totalDays }: { leaveType: any; totalDays: any }) => {
                // ✅ Add back the days instantly when cancelled
                if (leaveType === "sick") {
                  setLocalSickLeaves((prev) => Math.min(Number(totalSickLeaves), Number(prev) + Number(totalDays)));
                } else if (leaveType === "paid") {
                  setLocalCasualLeaves((prev) => Math.min(Number(totalCasualLeaves), Number(prev) + Number(totalDays)));
                }
              }}
            />
          ) : null}

          {/* Empty */}
          {!isLoading && (!leaveRequests || leaveRequests.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">
                No leave requests yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Leaves;
