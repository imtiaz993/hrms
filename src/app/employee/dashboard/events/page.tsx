'use client';

import { useGetUpcomingBirthdays, useGetUpcomingAnniversaries } from '@/hooks/useEvents';
import { EventCard } from '@/components/events/event-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Cake, Award } from 'lucide-react';

export default function EventsPage() {
  const {
    data: birthdays,
    isLoading: birthdaysLoading,
    error: birthdaysError,
    refetch: refetchBirthdays,
  } = useGetUpcomingBirthdays(30);

  const {
    data: anniversaries,
    isLoading: anniversariesLoading,
    error: anniversariesError,
    refetch: refetchAnniversaries,
  } = useGetUpcomingAnniversaries(30);

  const isLoading = birthdaysLoading || anniversariesLoading;
  const hasError = birthdaysError || anniversariesError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
        <p className="text-gray-600 mt-1">Celebrate with your teammates</p>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load events.
            <Button
              variant="link"
              onClick={() => {
                refetchBirthdays();
                refetchAnniversaries();
              }}
              className="ml-2 p-0 h-auto"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Cake className="h-5 w-5 text-pink-600" />
                <span>Upcoming Birthdays</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!birthdays || birthdays.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming birthdays in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {birthdays.map((event) => (
                    <EventCard key={event.id} event={event} type="birthday" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span>Work Anniversaries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!anniversaries || anniversaries.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming anniversaries in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anniversaries.map((event) => (
                    <EventCard key={event.id} event={event} type="anniversary" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
