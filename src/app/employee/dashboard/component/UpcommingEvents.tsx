import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, Award } from "lucide-react";

interface Props {
  cardBase: string;
  upcomingAnniversaries: any;
  upcomingBirthdays: any;
}
const UpcommingEvents = ({
  cardBase,
  upcomingAnniversaries,
  upcomingBirthdays,
}: Props) => {
  return (
    <Card className={`${cardBase} pb-12   w-full rounded-2xl`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Upcoming Events
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 lg:pb-14 py-4">
        
        {upcomingBirthdays && upcomingBirthdays.length > 0 && (
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
                )
              )}
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
                )
              )}
            </CardContent>
          </Card>
        )}

        
        {(!upcomingBirthdays || upcomingBirthdays.length === 0) &&
          (!upcomingAnniversaries || upcomingAnniversaries.length === 0) && (
            <p className="text-base text-center text-slate-400 py-4">
              No upcoming events
            </p>
          )}
      </CardContent>
    </Card>
  );
};

export default UpcommingEvents;
