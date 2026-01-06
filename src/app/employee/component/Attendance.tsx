import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TodayStatusCard } from "@/components/employee/today-status-card";
import { ClockActionCard } from "@/components/employee/clock-action-card";

interface AttendanceTodayCardProps {
  statusLoading: boolean;
  todayStatus: any;
  currentUser: {
    id: string;
    standard_hours_per_day: number;
    standard_shift_start: string;
    standard_shift_end: string;
  };
  refetchStatus: () => void;
  cardBase: string;
}

const AttendanceTodayCard = ({
  statusLoading,
  todayStatus,
  currentUser,
  refetchStatus,
  cardBase,
}: AttendanceTodayCardProps) => {
  return (
    <Card className={`${cardBase} flex-1 lg:w-1/2 border-indigo-100`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
          <span>Attendance Today</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            Live
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {statusLoading ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
            <p className="text-xs text-slate-500">
              {" "}
              Loading today&apos;s status…{" "}
            </p>{" "}
          </div>
        ) : (
          <div className="space-y-4">
            {" "}
            {todayStatus && <TodayStatusCard status={todayStatus} />}
            <ClockActionCard
              status={todayStatus ?? { status: "not_clocked_in" }}
              employeeId={currentUser.id}
              standardHours={currentUser.standard_hours_per_day}
              standardShiftStart={currentUser.standard_shift_start}
              standardShiftEnd={currentUser.standard_shift_end}
              onActionComplete={refetchStatus}
            />{" "}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceTodayCard;
