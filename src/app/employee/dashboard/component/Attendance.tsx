import { Card } from "@/components/ui/card";
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
    <Card className={`${cardBase} flex-1 lg:w-full`}>
      <div className="space-y-4">
        {todayStatus && (
          <TodayStatusCard status={todayStatus} loading={statusLoading} />
        )}
        <ClockActionCard
          status={todayStatus ?? { status: "not_clocked_in" }}
          employeeId={currentUser.id}
          standardHours={currentUser.standard_hours_per_day}
          standardShiftStart={currentUser.standard_shift_start}
          standardShiftEnd={currentUser.standard_shift_end}
          onActionComplete={refetchStatus}
        />
      </div>
    </Card>
  );
};

export default AttendanceTodayCard;
