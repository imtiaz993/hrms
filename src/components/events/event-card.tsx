"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpcomingEvent } from "@/hooks/useEvents";
import { Cake, Award } from "lucide-react";
import { formatDate } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: UpcomingEvent;
  type: "birthday" | "anniversary";
}

export function EventCard({ event, type }: EventCardProps) {
  const isBirthday = type === "birthday";
  const Icon = isBirthday ? Cake : Award;

  const iconBg = isBirthday ? "bg-pink-50" : "bg-blue-50";
  const iconColor = isBirthday ? "text-pink-600" : "text-blue-600";
  const badgeClass = isBirthday
    ? "bg-pink-100 text-pink-800"
    : "bg-blue-100 text-blue-800";

  const getCountdownText = (days: number): string => {
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  const getAnniversaryText = (years?: number): string => {
    if (!years) return "";
    if (years === 1) return "Completing 1 year";
    return `Completing ${years} years`;
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white/85 backdrop-blur-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-2xl p-3", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {event.employeeName}
              </h3>
              <Badge
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px]",
                  badgeClass
                )}
              >
                {getCountdownText(event.daysUntil)}
              </Badge>
            </div>

            {event.department && (
              <p className="text-xs text-slate-500">{event.department}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {formatDate(event.eventDate)}
              </span>
              {!isBirthday && event.yearsCompleted && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-medium text-blue-600">
                    {getAnniversaryText(event.yearsCompleted)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
