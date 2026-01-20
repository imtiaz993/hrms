import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, Award, CalendarClock } from "lucide-react";

interface Props {
  cardBase: string;
  upcomingAnniversaries: any[];
  upcomingBirthdays: any[];
  isLoading?: boolean;
}

const BlockSkeleton = () => {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-xs animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-3 py-2">
        <div className="h-3 w-48 rounded bg-slate-200" />
        <div className="h-3 w-36 rounded bg-slate-200" />
        <div className="h-3 w-56 rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
};

const UpcommingEvents = ({
  cardBase,
  upcomingAnniversaries,
  upcomingBirthdays,
  isLoading = false,
}: Props) => {
  return (
    <Card className={`${cardBase} pb-12 w-full rounded-2xl`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Upcoming Events
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 lg:pb-14 py-4">
        {/* Loading */}
        {isLoading && <BlockSkeleton />}

        {/* Birthdays */}
        {!isLoading && upcomingBirthdays && upcomingBirthdays.length > 0 && (
          <Card className={cardBase}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Cake className="h-4 w-4 text-pink-500" />
                <span>Upcoming Birthdays</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-2">
              {upcomingBirthdays.map(
                (b: { id: string | number; employeeName: string }) => (
                  <p key={b.id} className="text-xs text-slate-700">
                    {b.employeeName}
                  </p>
                ),
              )}
            </CardContent>
          </Card>
        )}

        {/* Anniversaries */}
        {!isLoading &&
          upcomingAnniversaries &&
          upcomingAnniversaries.length > 0 && (
            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Work Anniversaries</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-2">
                {upcomingAnniversaries.map(
                  (a: {
                    employeeName: string;
                    yearsCompleted: string;
                    id: string | number;
                  }) => (
                    <p key={a.id} className="text-xs text-slate-700">
                      {a.employeeName} ({a.yearsCompleted} years)
                    </p>
                  ),
                )}
              </CardContent>
            </Card>
          )}

        {/* Empty */}
        {!isLoading &&
          (!upcomingBirthdays || upcomingBirthdays.length === 0) &&
          (!upcomingAnniversaries || upcomingAnniversaries.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600">
                <CalendarClock className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                No upcoming events
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default UpcommingEvents;
