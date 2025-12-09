'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Holiday } from '@/types';
import { formatDate } from '@/lib/time-utils';
import { Calendar } from 'lucide-react';

interface UpcomingHolidaysProps {
  holidays: Holiday[];
}

export function UpcomingHolidays({ holidays }: UpcomingHolidaysProps) {
  if (holidays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming holidays in the next 90 days.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Holidays</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                  {holiday.is_recurring && (
                    <Badge variant="secondary" className="text-xs">
                      Recurring
                    </Badge>
                  )}
                </div>
                {holiday.description && (
                  <p className="text-sm text-gray-500 mt-1">{holiday.description}</p>
                )}
              </div>
              <div className="text-sm font-medium text-gray-600 ml-4">
                {formatDate(holiday.date)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
