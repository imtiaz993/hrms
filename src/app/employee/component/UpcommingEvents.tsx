import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, Award } from "lucide-react";

interface Props {
  cardBase: string;
}
const UpcommingEvents = ({ cardBase }: Props) => {
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    { id: string; employeeName: string }[]
  >([]);

  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<
    { id: string; employeeName: string; yearsCompleted: number }[]
  >([]);
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const { data, error } = await supabase.rpc(
        "employees_current_month_future"
      );

      if (error || !data) return;
      const upcomingBirthdays = data
        .filter((emp) => emp.date_of_birth)
        .map((emp) => {
          const dob = new Date(emp.date_of_birth);
          const birthdayThisYear = new Date(
            currentYear,
            dob.getMonth(),
            dob.getDate()
          );

          return {
            emp,
            eventDate: birthdayThisYear,
          };
        })
        .filter(
          (e) =>
            e.eventDate > today &&
            e.eventDate <= endOfMonth &&
            e.eventDate.getMonth() === currentMonth
        )
        .map((e) => ({
          id: e.emp.id,
          employeeName: `${e.emp.first_name} ${e.emp.last_name} ${e.emp.date_of_birth}`,
          eventDate: e.eventDate,
        }))
        .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
      const upcomingAnniversaries = data
        .filter((emp) => emp.join_date)
        .map((emp) => {
          const join = new Date(emp.join_date);
          const anniversaryThisYear = new Date(
            currentYear,
            join.getMonth(),
            join.getDate()
          );

          const yearsCompleted = currentYear - join.getFullYear();

          return {
            emp,
            eventDate: anniversaryThisYear,
            yearsCompleted,
          };
        })
        .filter(
          (e) =>
            e.eventDate > today &&
            e.eventDate <= endOfMonth &&
            e.yearsCompleted > 0 &&
            e.eventDate.getMonth() === currentMonth
        )
        .map((e) => ({
          id: e.emp.id,
          employeeName: `${e.emp.first_name} ${e.emp.last_name} ${e.emp.date_of_birth}`,
          yearsCompleted: e.yearsCompleted,
          eventDate: e.eventDate,
        }))
        .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

      setUpcomingBirthdays(upcomingBirthdays);
      setUpcomingAnniversaries(upcomingAnniversaries);
    };

    fetchUpcomingEvents();
  }, []);

  return (
    <Card className={`${cardBase} flex-1 lg:w-1/2`}>
      <section aria-labelledby="upcoming-events-heading" className="space-y-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span> Upcoming Events</span>
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
          {upcomingBirthdays && upcomingBirthdays.length > 0 && (
            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Cake className="h-4 w-4 text-pink-500" />
                  <span>Upcoming Birthdays</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingBirthdays.map((b) => (
                    <p key={b.id} className="text-xs text-slate-700">
                      {b.employeeName}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {upcomingAnniversaries && upcomingAnniversaries.length > 0 && (
            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Work Anniversaries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAnniversaries.map((a) => (
                    <p key={a.id} className="text-xs text-slate-700">
                      {a.employeeName} ({a.yearsCompleted} years)
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {upcomingBirthdays.length === 0 &&
            upcomingAnniversaries.length === 0 && (
              <p className="text-base text-center text-slate-400">
                No upcoming events
              </p>
            )}
        </div>
      </section>
    </Card>
  );
};

export default UpcommingEvents;
