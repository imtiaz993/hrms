import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, CalendarDays } from "lucide-react";

interface Props {
  cardBase: string;
  holidays: any[];
  isLoading?: boolean;
}

const HolidaySkeleton = () => {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-xs animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-3 w-32 rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
};

const UpcomingHoliday = ({ cardBase, holidays, isLoading = false }: Props) => {
  return (
    <Card className={`${cardBase} flex-1 md:full lg:w-full`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span>Upcoming Holidays</span>
        </CardTitle>
      </CardHeader>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3 px-4 pb-6">
          <HolidaySkeleton />
        </div>
      )}

      {/* Data */}
      {!isLoading &&
        holidays &&
        holidays.length > 0 &&
        holidays.map((h: any) => (
          <Card key={h.id} className={cardBase}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                {h.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-700">
                {new Date(h.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </CardContent>
          </Card>
        ))}

      {/* Empty */}
      {!isLoading && (!holidays || holidays.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-2xl py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No upcoming holidays
          </p>
        </div>
      )}
    </Card>
  );
};

export default UpcomingHoliday;
