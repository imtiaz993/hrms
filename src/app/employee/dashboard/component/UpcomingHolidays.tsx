import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

interface Props {
  cardBase: string;
  holidays: any;
}
const UpcomingHoliday = ({ cardBase, holidays }: Props) => {
  return (
    <>
      <Card className={`${cardBase} flex-1 md:full  lg:w-full`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <span> Upcoming Holidays</span>
            </CardTitle>
          </CardHeader>

          {holidays.map((h: any) => (
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
          {(!holidays || holidays.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-2xl py-8 text-center">
              <CalendarIcon className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No upcoming holidays.</p>
            </div>
          )}
      </Card>
    </>
  );
};

export default UpcomingHoliday;
