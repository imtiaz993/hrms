import { Card } from "@/components/ui/card";
import { ClockActionCard } from "@/components/employee/clock-action-card";

interface AttendanceTodayCardProps {
  statusLoading: boolean;
  todayStatus: any;
  currentUser: any;
  refetchStatus: () => void;
  cardBase: string;
}

const AttendanceTodayCard = ({
  todayStatus,
  currentUser,
  refetchStatus,
}: AttendanceTodayCardProps) => {
  return (
    <ClockActionCard
      status={todayStatus ?? { status: "not_clocked_in" }}
      employeeId={currentUser.id}
      standardHours={currentUser.standard_hours_per_day}
      standardShiftStart={currentUser.standard_shift_start}
      standardShiftEnd={currentUser.standard_shift_end}
      employeeName={currentUser?.first_name + " " + currentUser?.last_name}
      onActionComplete={refetchStatus}
    />
  );
};

export default AttendanceTodayCard;
