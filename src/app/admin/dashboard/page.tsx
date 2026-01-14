"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetAllEmployees } from "@/hooks/admin/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  CalendarIcon,
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
import { supabase } from "@/lib/supabaseUser";

interface Holiday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
}
interface Props {
  cardBase: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { data: employees } = useGetAllEmployees();
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const activeEmployees = employees?.filter((emp) => emp.is_active).length || 0;
  const totalEmployees = employees?.length || 0;
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
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
  const UpcomingHoliday = ({ cardBase }: Props) => {
    useEffect(() => {
      const fetchHolidays = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from("holidays")
          .select("id, name, date, is_recurring");

        if (error || !data) return;

        const upcomingHolidays = data
          .map((h: Holiday) => {
            const eventDate = new Date(h.date);
            eventDate.setHours(0, 0, 0, 0);

            return { ...h, eventDate };
          })
          .filter((h: any) => {
            return (
              h.eventDate.getFullYear() === currentYear &&
              h.eventDate.getMonth() === currentMonth &&
              h.eventDate >= today &&
              h.eventDate <= endOfMonth
            );
          })
          .sort(
            (a: any, b: any) => a.eventDate.getTime() - b.eventDate.getTime()
          );

        setHolidays(upcomingHolidays);
      };

      fetchHolidays();
    }, []);

    return (
      <>
        <Card className={`${cardBase} flex-1 lg:w-1/2`}>
          <CardHeader className="pb-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <span> Upcoming Holidays</span>
              </CardTitle>
            </CardHeader>

            {holidays.map((h) => (
              <Card key={h.id} className={cardBase}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    {h.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-700">
                    {new Date(h.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
            {(!holidays || holidays.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-2xl py-8 text-center">
                <CalendarIcon className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">No upcoming holidays.</p>
              </div>
            )}
          </CardHeader>
        </Card>
      </>
    );
  };

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>();
  const [notification, setNotification] = useState<any>();
  const [isOpen, setOpen] = useState(false);

  const fetchNotification = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "admin");
    if (error) setError(error);
    else setNotification(data || []);
    console.log("notification", data);

    setLoading(false);
  };
  const handleIconClick = () => {
    setOpen(!isOpen);
    if (!isOpen) {
      fetchNotification();
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your organization</p>
        </div>
        <div className="relative">
          {/* Notification Icon */}
          <button onClick={handleIconClick} className="relative">
            🔔
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 max-w-80 bg-white shadow-lg rounded-lg z-50 max-h-80   overflow-y-auto">
              {loading ? (
                <p className="p-4 text-gray-500">Loading...</p>
              ) : notification.length === 0 ? (
                <p className="p-4 text-gray-500">No notifications</p>
              ) : (
                notification.map((n:any) => (
                  <div
                    key={n.id}
                    className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-gray-600">
                      {n.body || n.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowProfile(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-150 hover:bg-blue-100 hover:border-blue-200"
        >
          <span>{profileInitials}</span>
        </button>
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
              <div className="text-3xl font-bold text-gray-900">4</div>
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
              <div className="text-3xl font-bold text-gray-900">
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
