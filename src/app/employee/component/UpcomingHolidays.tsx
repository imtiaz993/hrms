import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
}
interface Props {
  cardBase: string;
}
const UpcomingHoliday = ({ cardBase }: Props) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

 useEffect(() => {
  const fetchHolidays = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("holidays")
      .select("id, name, date, is_recurring");

    if (error || !data) return;

    const upcomingHolidays = data
      .map((h: Holiday) => {
        const eventDate = new Date(h.date);
        eventDate.setHours(0, 0, 0, 0);

        return { ...h, eventDate };
      })
      .filter((h) => {
        return (
          h.eventDate.getFullYear() === currentYear &&
          h.eventDate.getMonth() === currentMonth &&
          h.eventDate >= today &&
          h.eventDate <= endOfMonth
        );
      })
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

    setHolidays(upcomingHolidays);
  };

  fetchHolidays();
}, []);


  return (
    <>
      <Card className={`${cardBase} flex-1 lg:w-1/2`}>
        <CardHeader className="pb-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <span> Upcoming Holidays</span>
            </CardTitle>
          </CardHeader>

          {holidays.map((h) => (
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
        </CardHeader>
      </Card>
    </>
  );
};

export default UpcomingHoliday;
