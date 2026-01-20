import { LeaveRequestPopup } from "@/components/employee/leave-request-popup";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React, { useState } from "react";

const Leaves = ({
  cardBase,
  sickLeaves,
  casualLeaves,
  leaveRequests,
  currentUser,
  setLeaveRequests,
}: any) => {
  const [showLeaveRequest, setShowLeaveRequest] = useState(false);
  return (
    <>
      {showLeaveRequest && (
        <LeaveRequestPopup
          employeeId={currentUser.id}
          onClose={() => setShowLeaveRequest(false)}
          leaves={leaveRequests}
          setLeaves={setLeaveRequests}
        />
      )}
      <Card className={cardBase}>
        <CardHeader className="">
          <CardTitle className="text-base font-semibold text-slate-900">
            Leaves
          </CardTitle>

          <div className="text-sm text-slate-400 grid grid-cols-2">
            <p>Sick Leaves: {sickLeaves}</p>
            <p>Casual Leaves: {casualLeaves}</p>
          </div>
          <Button
            onClick={() => setShowLeaveRequest(true)}
            className="mt-4 rounded-full px-1 text-sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Request leave
          </Button>
        </CardHeader>

        <CardContent>
          {leaveRequests && leaveRequests.length > 0 ? (
            <LeaveRequestsList
              requests={leaveRequests}
              employeeId={currentUser.id}
              setLeaves={setLeaveRequests}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center">
              <p className="text-sm text-slate-500">No leave requests yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Leaves;
