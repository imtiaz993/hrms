"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { formatDate } from "@/lib/time-utils";
import { Calendar } from "lucide-react";

interface UpcomingHoliday {
  id: string;
  name: string;
  date: string;
  description?: string | null;
  is_recurring?: boolean;
}

interface UpcomingHolidaysProps {
  holidays: UpcomingHoliday[];
}


export function UpcomingHolidays({ holidays }: UpcomingHolidaysProps) {
  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm";

  if (holidays.length === 0) {
    return (
      <Card className={cardBase}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center">
            <Calendar className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              No upcoming holidays in the next 90 days.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              New holidays will appear here as soon as HR adds them.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardBase}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Upcoming Holidays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {holiday.name}
                  </h4>
                  {holiday.is_recurring && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2 py-0.5 text-[11px]"
                    >
                      Recurring
                    </Badge>
                  )}
                </div>
                {holiday.description && (
                  <p className="mt-1 text-xs text-slate-500">
                    {holiday.description}
                  </p>
                )}
              </div>
              <div className="ml-4 flex flex-col items-end text-right">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Date
                </span>
                <span className="mt-0.5 text-sm font-semibold text-slate-800">
                  {formatDate(holiday.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
