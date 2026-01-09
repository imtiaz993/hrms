"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, Award } from "lucide-react";

interface Props {
  cardBase: string;
  todayAnniversaries:any;
  todayBirthdays:any;
}
export default function UserInfoCard({ cardBase,todayAnniversaries,todayBirthdays}: Props) {


 
  
  return (
    <Card className={`${cardBase}  flex-1 `}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
          <span>Today Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl bg-slate-50/80 p-3">
          <div className="mt-2 space-y-2">
            {todayBirthdays.length > 0 && (
              <div className="rounded-xl bg-white/80 p-2.5 shadow-xs">
                <p className="flex items-center gap-1.5 text-base font-semibold text-pink-600">
                  <Cake className="h-3.5 w-3.5" />
                  Birthdays
                </p>
                <div className="mt-1 space-y-0.5">
                  {todayBirthdays.map((b:any, index:any) => (
                    <p key={index} className="text-base text-slate-700">
                      {b.employeeName}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {todayAnniversaries.length > 0 && (
              <div className="rounded-xl bg-white/80 p-2.5 shadow-xs">
                <p className="flex items-center gap-1.5 text-base font-semibold text-blue-600">
                  <Award className="h-3.5 w-3.5" />
                  Work Anniversaries
                </p>
                <div className="mt-1 space-y-0.5">
                  {todayAnniversaries.map((a:any, index:any) => (
                    <p key={index} className="text-base text-slate-700">
                      {a.employeeName} ({a.yearsCompleted} years)
                    </p>
                  ))}
                </div>
              </div>
            )}
            {todayBirthdays.length === 0 && todayAnniversaries.length === 0 && (
              <p className="text-base text-slate-400">No events today</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
