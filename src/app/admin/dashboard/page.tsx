"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetAllEmployees } from "@/hooks/admin/useEmployees";
import {
  useGetUpcomingBirthdays,
  useGetUpcomingAnniversaries,
} from "@/hooks/useEvents";
import { useGetUpcomingHolidays } from "@/hooks/useLeave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Cake,
  Award,
  Clock,
  DollarSign,
  Plus,
} from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { UpcomingHolidays } from "@/components/leave/upcoming-holidays";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { ChangePasswordPopup } from "@/components/employee/change-password-popup";
import { format } from "date-fns";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { data: employees } = useGetAllEmployees();
  const { data: holidays } = useGetUpcomingHolidays(90);
  const { data: birthdays } = useGetUpcomingBirthdays(30);
  const { data: anniversaries } = useGetUpcomingAnniversaries(30);

  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const activeEmployees = employees?.filter((emp) => emp.is_active).length || 0;
  const totalEmployees = employees?.length || 0;

  const todayBirthdays = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return birthdays?.filter((b) => b.eventDate === today) || [];
  }, [birthdays]);

  const todayAnniversaries = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return anniversaries?.filter((a) => a.eventDate === today) || [];
  }, [anniversaries]);

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your organization</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Employees
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalEmployees}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active employees</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Present Today
              </CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-xs text-gray-500 mt-1">Clocked in</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Absent
              </CardTitle>
              <Users className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">4</div>
              <p className="text-xs text-gray-500 mt-1">Not clocked in</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Late Arrivals
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">0</div>
              <p className="text-xs text-gray-500 mt-1">After start time</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Early Leaves
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">0</div>
              <p className="text-xs text-gray-500 mt-1">Left early</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Incomplete
              </CardTitle>
              <Clock className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">0</div>
              <p className="text-xs text-gray-500 mt-1">Missing punch</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Payroll
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Monthly Payroll
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap">
                USD 1945.50
              </div>
              <p className="text-xs text-gray-500 mt-1">Total company cost</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Hours Worked
              </CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">64.3h</div>
              <p className="text-xs text-gray-500 mt-1">Across all employees</p>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Employees
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">4</div>
              <p className="text-xs text-gray-500 mt-1">Active employees</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={cardBase}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Today&apos;s Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayBirthdays.length > 0 && (
                <div className="rounded-xl bg-pink-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-pink-600">
                    <Cake className="h-3.5 w-3.5" />
                    Birthdays
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {todayBirthdays.map((b) => (
                      <p key={b.id} className="text-xs text-gray-700">
                        {b.employeeName}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {todayAnniversaries.length > 0 && (
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <Award className="h-3.5 w-3.5" />
                    Work Anniversaries
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {todayAnniversaries.map((a) => (
                      <p key={a.id} className="text-xs text-gray-700">
                        {a.employeeName} ({a.yearsCompleted} years)
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {todayBirthdays.length === 0 &&
                todayAnniversaries.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No events today
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className={cardBase}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center justify-between">
              <span>Upcoming Holidays</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {holidays && holidays.length > 0 ? (
              <UpcomingHolidays holidays={holidays} />
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No upcoming holidays</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming Events
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {birthdays && birthdays.length > 0 ? (
            birthdays
              .slice(0, 4)
              .map((birthday) => (
                <EventCard key={birthday.id} event={birthday} type="birthday" />
              ))
          ) : (
            <Card className={cardBase}>
              <CardContent className="p-6 text-center">
                <Cake className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No upcoming birthdays</p>
              </CardContent>
            </Card>
          )}

          {anniversaries && anniversaries.length > 0 ? (
            anniversaries
              .slice(0, 4)
              .map((anniversary) => (
                <EventCard
                  key={anniversary.id}
                  event={anniversary}
                  type="anniversary"
                />
              ))
          ) : (
            <Card className={cardBase}>
              <CardContent className="p-6 text-center">
                <Award className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  No upcoming anniversaries
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {showProfile && currentUser && (
        <ProfilePopup
          employee={currentUser}
          onClose={() => setShowProfile(false)}
          onChangePassword={() => {
            setShowProfile(false);
            setShowChangePassword(true);
          }}
        />
      )}

      {showChangePassword && currentUser && (
        <ChangePasswordPopup
          employee={currentUser}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
