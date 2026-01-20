"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake, Award, CalendarX } from "lucide-react";

interface Props {
  cardBase: string;
  todayAnniversaries: any[];
  todayBirthdays: any[];
  isLoading?: boolean;
}

const SectionSkeleton = () => {
  return (
    <div className="rounded-xl bg-white/80 p-2.5 shadow-xs space-y-2 animate-pulse">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="h-4 w-48 rounded bg-slate-200" />
      <div className="h-4 w-36 rounded bg-slate-200" />
    </div>
  );
};

export default function TodayEvents({
  cardBase,
  todayAnniversaries,
  todayBirthdays,
  isLoading = false,
}: Props) {
  return (
    <Card className={`${cardBase} flex-1`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
          <span>Today Events</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl p-3">
          <div className="mt-2 space-y-2">
            {/* Loading Skeleton */}
            {isLoading && <SectionSkeleton />}

            {/* Birthdays */}
            {!isLoading && todayBirthdays.length > 0 && (
              <div className="rounded-xl bg-white/80 p-2.5 shadow-xs">
                <p className="flex items-center gap-1.5 text-base font-semibold text-pink-600">
                  <Cake className="h-3.5 w-3.5" />
                  Birthdays
                </p>
                <div className="mt-1 space-y-0.5">
                  {todayBirthdays.map((b: any, index: number) => (
                    <p key={index} className="text-base text-slate-700">
                      {b.employeeName}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Anniversaries */}
            {!isLoading && todayAnniversaries.length > 0 && (
              <div className="rounded-xl bg-white/80 p-2.5 shadow-xs">
                <p className="flex items-center gap-1.5 text-base font-semibold text-blue-600">
                  <Award className="h-3.5 w-3.5" />
                  Work Anniversaries
                </p>
                <div className="mt-1 space-y-0.5">
                  {todayAnniversaries.map((a: any, index: number) => (
                    <p key={index} className="text-base text-slate-700">
                      {a.employeeName} ({a.yearsCompleted} years)
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading &&
              todayBirthdays.length === 0 &&
              todayAnniversaries.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl bg-white/70 p-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <CalendarX className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    No events today
                  </p>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
