'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpcomingEvent } from '@/hooks/useEvents';
import { Cake, Award, User } from 'lucide-react';
import { formatDate } from '@/lib/time-utils';

interface EventCardProps {
  event: UpcomingEvent;
  type: 'birthday' | 'anniversary';
}

export function EventCard({ event, type }: EventCardProps) {
  const isBirthday = type === 'birthday';
  const Icon = isBirthday ? Cake : Award;
  const iconColor = isBirthday ? 'text-pink-600' : 'text-blue-600';
  const badgeColor = isBirthday ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800';

  const getCountdownText = (days: number): string => {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const getAnniversaryText = (years?: number): string => {
    if (!years) return '';
    if (years === 1) return 'Completing 1 year';
    return `Completing ${years} years`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full bg-gray-100`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {event.employeeName}
              </h3>
              <Badge className={badgeColor}>
                {getCountdownText(event.daysUntil)}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 mb-1">{event.department}</p>

            <div className="flex items-center text-sm text-gray-500 space-x-2">
              <span>{formatDate(event.eventDate)}</span>
              {!isBirthday && event.yearsCompleted && (
                <>
                  <span>•</span>
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
