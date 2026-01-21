"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetAllEmployees } from "@/hooks/admin/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import UpcomingHoliday from "@/app/employee/dashboard/component/UpcomingHolidays";
import UpcommingEvents from "@/app/employee/dashboard/component/UpcommingEvents";
import TodayEvents from "@/app/employee/dashboard/component/TodayEvents";

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
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    { id: string; employeeName: string }[]
  >([]);
  const [todayBirthdays, setTodayBirthdays] = useState<
    { employeeName: string }[]
  >([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState<
    { employeeName: string; yearsCompleted: number }[]
  >([]);
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<
    { id: string; employeeName: string; yearsCompleted: number }[]
  >([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    late: 0,
    early: 0,
    ontime: 0,
  });

  // const todayBirthdays = useMemo(() => {
  //   const today = format(new Date(), "yyyy-MM-dd");
  //   return birthdays?.filter((b) => b.eventDate === today) || [];
  // }, [birthdays]);

  // const todayAnniversaries = useMemo(() => {
  //   const today = format(new Date(), "yyyy-MM-dd");
  //   return anniversaries?.filter((a) => a.eventDate === today) || [];
  // }, [anniversaries]);

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
    console.log("HOLIDAYS DATA:", data);
    console.log("HOLIDAYS ERROR:", error);

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
      .sort((a: any, b: any) => a.eventDate.getTime() - b.eventDate.getTime());

    setHolidays(upcomingHolidays);
  };

  const fetchUpcomingEvents = async () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const { data, error } = await supabase.rpc(
      "employees_current_month_future"
    );

    if (error || !data) return;
    const upcomingBirthdays = data
      .filter((emp: any) => emp.date_of_birth)
      .map((emp: any) => {
        const dob = new Date(emp.date_of_birth);
        const birthdayThisYear = new Date(
          currentYear,
          dob.getMonth(),
          dob.getDate()
        );

        return {
          emp,
          eventDate: birthdayThisYear,
        };
      })
      .filter(
        (e: any) =>
          e.eventDate > today &&
          e.eventDate <= endOfMonth &&
          e.eventDate.getMonth() === currentMonth
      )
      .map((e: any) => ({
        id: e.emp.id,
        employeeName: `${e.emp.first_name} ${e.emp.last_name} ${e.emp.date_of_birth}`,
        eventDate: e.eventDate,
      }))
      .sort((a: any, b: any) => a.eventDate.getTime() - b.eventDate.getTime());
    const upcomingAnniversaries = data
      .filter((emp: any) => emp.join_date)
      .map((emp: any) => {
        const join = new Date(emp.join_date);
        const anniversaryThisYear = new Date(
          currentYear,
          join.getMonth(),
          join.getDate()
        );

        const yearsCompleted = currentYear - join.getFullYear();

        return {
          emp,
          eventDate: anniversaryThisYear,
          yearsCompleted,
        };
      })
      .filter(
        (e: any) =>
          e.eventDate > today &&
          e.eventDate <= endOfMonth &&
          e.yearsCompleted > 0 &&
          e.eventDate.getMonth() === currentMonth
      )
      .map((e: any) => ({
        id: e.emp.id,
        employeeName: `${e.emp.first_name} ${e.emp.last_name} ${e.emp.date_of_birth}`,
        yearsCompleted: e.yearsCompleted,
        eventDate: e.eventDate,
      }))
      .sort((a: any, b: any) => a.eventDate.getTime() - b.eventDate.getTime());

    setUpcomingBirthdays(upcomingBirthdays);
    setUpcomingAnniversaries(upcomingAnniversaries);
  };
  const fetchTodayEvents = async () => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    const currentYear = today.getFullYear();

    const { data, error } = await supabase.rpc("employees_today");

    if (error) {
      console.error("Supabase error:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.error("No employees found");
      return;
    }
    const birthdays = data
      .filter((emp: any) => {
        if (!emp.date_of_birth) return false;

        const dob = new Date(emp.date_of_birth);

        return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
      })
      .map((emp: any) => ({
        employeeName: `${emp.first_name} ${emp.last_name}`,
      }));

    const anniversaries = data
      .filter((emp: any) => {
        if (!emp.join_date) return false;

        const join = new Date(emp.join_date);

        return join.getMonth() === todayMonth && join.getDate() === todayDate;
      })
      .map((emp: any) => {
        const join = new Date(emp.join_date!);
        const yearsCompleted = currentYear - join.getFullYear();
        return {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          yearsCompleted,
        };
      })
      .filter((a: any) => a.yearsCompleted >= 0);

    setTodayBirthdays(birthdays);
    setTodayAnniversaries(anniversaries);
  };

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);
  const fetchAdminAttendanceToday = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: employees } = await supabase
      .from("employees")
      .select("id")
      .eq("is_active", true);

    const totalEmployees = employees?.length || 0;

    const { data: entries } = await supabase
      .from("time_entries")
      .select("employee_id, is_late, is_early_leave")
      .eq("date", today);

    const present = entries?.length || 0;
    const late = entries?.filter((e) => e.is_late).length || 0;
    const early = entries?.filter((e) => e.is_early_leave).length || 0;
    const absent = totalEmployees - present;
    const ontime = entries?.filter((e) => !e.is_late).length || 0;

    setAttendance({
      present,
      absent,
      late,
      early,
      ontime,
    });
  };

  useEffect(() => {
    fetchHolidays();
    fetchUpcomingEvents();
    fetchTodayEvents;
    fetchAdminAttendanceToday();
  }, []);

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm";

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
              <div className="text-3xl font-bold text-green-600">
                {attendance.present}
              </div>
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
              <div className="text-3xl font-bold text-red-600">
                {attendance.absent}
              </div>
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
              <div className="text-3xl font-bold text-orange-600">
                {attendance.late}
              </div>
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
              <div className="text-3xl font-bold text-amber-600">
                {attendance.early}
              </div>
              <p className="text-xs text-gray-500 mt-1">Left early</p>
            </CardContent>
          </Card>
          <Card className={cardBase}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                on time
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {attendance.ontime}
              </div>
              <p className="text-xs text-gray-500 mt-1">on time</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TodayEvents
          cardBase={cardBase}
          todayBirthdays={todayBirthdays}
          todayAnniversaries={todayAnniversaries}
        />

        <UpcomingHoliday cardBase={cardBase} holidays={holidays} />
        <UpcommingEvents
          upcomingBirthdays={upcomingBirthdays}
          upcomingAnniversaries={upcomingAnniversaries}
          cardBase={cardBase}
        />
      </div>

      <section></section>
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
