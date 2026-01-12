"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";
import UpcomingHoliday from "../component/UpcomingHolidays";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Plus, RefreshCw } from "lucide-react";
import { AttendanceKPICards } from "@/components/attendance/attendance-kpi-cards";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { ChangePasswordPopup } from "@/components/employee/change-password-popup";
import { LeaveRequestPopup } from "@/components/employee/leave-request-popup";
import { SalaryViewPopup } from "@/components/employee/salary-view-popup";
import { WorkingHoursChartCard } from "@/components/employee/working-hours-chart-card";
import { supabase } from "@/lib/Supabase";
import UserInfoCard from "../component/UserInfo";
import UpcommingEvents from "../component/UpcommingEvents";
import AttendanceTodayCard from "../component/Attendance";
import { AttendanceAnalytics, DailyAttendance } from "@/types";
import { LeaveRequest } from "@/types";
import FCMTokenManager from "./FCMTokenManager";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "../../../firebase";

interface TimeEntry {
  date: string;
  total_hours: number;
  standard_hours: number;
  is_late: boolean;
  is_early_leave: boolean;
  time_in: string;
  time_out: string | null;
}
 interface TodayStatus {
  date: string;
  status: "not_clocked_in" | "clocked_in" | "completed";
  timeIn: string | null;
  timeOut: string | null;
  elapsedHours: number | null;
  totalHours: number | null;
  overtimeHours: number;
  isLate: boolean;
  lateByMinutes: number | null;
  timeEntryId:number
  clockIn:string|null;
clockOut:string;

}
export default function EmployeeDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.auth);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLeaveRequest, setShowLeaveRequest] = useState(false);
  const [showSalaryView, setShowSalaryView] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
 const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sickLeaves, setSickLeaves] = useState(0);
  const [casualLeaves, setCasualLeaves] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    { id: string; employeeName: string }[]
  >([]);
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<
    { id: string; employeeName: string; yearsCompleted: number }[]
  >([]);
  const [holidays, setHolidays] = useState<[]>([]);
  const [todayBirthdays, setTodayBirthdays] = useState<
    { employeeName: string }[]
  >([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState<
    { employeeName: string; yearsCompleted: number }[]
  >([]);

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
 useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      try {
        if (!("Notification" in window)) return console.log("Browser not supported");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        //  Register the service worker
        const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        // Get the FCM token
        const token = await getToken(messaging, {
          vapidKey: "BLJaC9ebeDDCWMDUspWw0N-4q-UKZ5nQfcNDBoEPYeQbU9UsFZaUtdqSF6tR6WvtVxv-J4kpBHTlJyRqk2z5jZc", // <- Replace with your actual VAPID key
          serviceWorkerRegistration: swRegistration,
        });

        if (token) {
          console.log(" FCM registration token:", token);
          setFcmToken(token);
        }
      } catch (err) {
        console.error("Error generating FCM token:", err);
      }
    };

    requestPermissionAndGetToken();
  }, []);

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
  function mapTimeEntryToTodayStatus(
    entry: any,
    standardHours: number,
    standardShiftStart: string
  ): TodayStatus {
    if (entry.clock_in && entry.clock_out) {
      return {
        status: "completed",
        timeEntryId: entry.id,
        clockIn: entry.clock_in,
        clockOut: entry.clock_out,
  
        totalHours: 0,
        date: "",
  
        timeIn: null,
        timeOut: null,
        elapsedHours: null,
  
        overtimeHours: 0,
        isLate: false,
        lateByMinutes: null,
      };
    }
  
    if (entry.clock_in && !entry.clock_out) {
      return {
        status: "clocked_in",
        timeEntryId: entry.id,
        clockIn: entry.clock_in,
        clockOut:"",
         totalHours: 0,
        date: "",
  
        timeIn: null,
        timeOut: null,
        elapsedHours: null,
  
        overtimeHours: 0,
        isLate: false,
        lateByMinutes: null,
      };
    }
  
    return {
      status: "not_clocked_in",
      
        timeEntryId: NaN,
        clockIn: "",
        clockOut:"",
       totalHours: 0,
        date: "",
        timeIn: null,
        timeOut: null,
        elapsedHours: null,
  
        overtimeHours: 0,
        isLate: false,
        lateByMinutes: null,
    };
  }
  
  const fetchTodayStatus = async () => {
    setStatusLoading(true);

    if (!currentUser?.id) {
      setTodayStatus(null);
      setStatusLoading(false);
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", currentUser.id)
      .gte("date", today + "T00:00:00")
      .lte("date", today + "T23:59:59")
      .order("clock_in", { ascending: false });

    if (error || !entries || entries.length === 0) {
      setTodayStatus(null);
    } else {
      const latestEntry = entries[0];
      if (latestEntry.clock_out) {
        setTodayStatus({
          status: "completed",
          timeEntryId: latestEntry.id,
          clockIn: latestEntry.clock_in,
          clockOut: latestEntry.clock_out,
          totalHours: latestEntry.total_hours,
          date: "",
          timeIn: null,
          timeOut: null,
          elapsedHours: null,
          overtimeHours: 0,
          isLate: false,
          lateByMinutes: null,
        });
      } else {
        setTodayStatus(
          mapTimeEntryToTodayStatus(
            latestEntry,
            currentUser.standard_hours_per_day,
            currentUser.standard_shift_start
          )
        );
      }
    }

    setStatusLoading(false);
  };
  const fetchEmployee = async (employeeId: string) => {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (error || !employee) {
      throw error;
    }

    setSickLeaves(Number(employee.total_sick_leaves));
    setCasualLeaves(Number(employee.total_casual_leaves));

    return employee;
  };
  const fetchLeaves = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", currentUser?.id)
      .order("start_date", { ascending: false });

    if (error) setError(error);
    else setLeaveRequests(data || []);

    setLoading(false);
  };

  const fetchEntries = async () => {
    setIsLoading(true);

    const start = format(
      startOfMonth(new Date(selectedYear, selectedMonth - 1)),
      "yyyy-MM-dd"
    );
    const end = format(
      endOfMonth(new Date(selectedYear, selectedMonth - 1)),
      "yyyy-MM-dd"
    );
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", currentUser?.id)
      .gte("date", start)
      .lte("date", end);
    if (error) {
      console.error("Error fetching time entries:", error);
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };
  const fetchAllData = () => {
    fetchTodayStatus();
    fetchTodayEvents();
    fetchUpcomingEvents();
    fetchLeaves();
    fetchEntries();
  };
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchAllData();
  }, [
    currentUser?.id,
    currentUser?.standard_hours_per_day,
    currentUser?.standard_shift_start,
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData?.user) {
        router.replace("/login");
        return;
      }

      const authUserId = userData.user.id;

      try {
        const employee = await fetchEmployee(authUserId);

        if (employee.is_admin) {
          router.replace("/admin/dashboard");
          return;
        }

        setCheckingAuth(false);
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);

  const refetchStatus = async () => {
    await Promise.all([fetchEntries()]);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    localStorage.removeItem("hrmsCurrentUser");
    dispatch(logoutAction());
    router.push("/login");
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const months = useMemo(() => {
    if (!entries.length) {
      const now = new Date();
      return [
        {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          label: format(now, "MMMM yyyy"),
        },
      ];
    }

    const monthsSet = new Set<string>();
    entries.forEach((entry) => {
      const date = parseISO(entry.date);
      monthsSet.add(format(date, "yyyy-MM"));
    });

    return Array.from(monthsSet)
      .sort()
      .reverse()
      .slice(0, 12)
      .map((key) => {
        const [yearStr, monthStr] = key.split("-");
        return {
          month: Number(monthStr),
          year: Number(yearStr),
          label: format(
            new Date(Number(yearStr), Number(monthStr) - 1),
            "MMMM yyyy"
          ),
        };
      });
  }, [entries]);

  useEffect(() => {
    if (
      months &&
      months.length > 0 &&
      selectedMonth === new Date().getMonth() + 1
    ) {
      setSelectedMonth(months[0].month);
      setSelectedYear(months[0].year);
    }
  }, [months, selectedMonth]);

  const chartData = useMemo(() => {
    const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const allDays = eachDayOfInterval({ start, end });

    return allDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entries.find((e) => e.date === dateStr);
      return {
        date: dateStr,
        day: day.getDate(),
        ...entry,
        standard_hours:
          entry?.standard_hours || currentUser?.standard_hours_per_day,
        total_hours: entry?.total_hours || 0,
        is_late: entry?.is_late ?? false,
        is_early_leave: entry?.is_early_leave ?? false,
      };
    });
  }, [
    entries,
    selectedMonth,
    selectedYear,
    currentUser?.standard_hours_per_day,
  ]);

  const data = useMemo<AttendanceAnalytics>(() => {
    const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const todayStr = format(new Date(), "yyyy-MM-dd");

    const entriesMap = new Map<string, TimeEntry>();
    entries.forEach((entry) => {
      entriesMap.set(entry.date, entry);
    });

    let presentDays = 0;
    let absentDays = 0;
    let lateArrivals = 0;
    let earlyLeaves = 0;
    let totalHoursWorked = 0;

    const dailyAttendance: DailyAttendance[] = eachDayOfInterval({
      start,
      end,
    }).map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entriesMap.get(dateStr);

      if (dateStr > todayStr) {
        return {
          date: dateStr,
          status: "future",
          isLate: false,
          isEarlyLeave: false,
        };
      }

      if (!entry) {
        absentDays++;
        return {
          date: dateStr,
          status: "absent",
          isLate: false,
          isEarlyLeave: false,
        };
      }

      presentDays++;
      if (entry.is_late) lateArrivals++;
      if (entry.is_early_leave) earlyLeaves++;
      if (entry.total_hours) totalHoursWorked += entry.total_hours;

      let status: DailyAttendance["status"] = "present";
      if (entry.is_late) status = "late";
      if (entry.is_early_leave) status = "early_leave";

      return {
        date: dateStr,
        status,
        timeIn: entry.time_in,
        timeOut: entry.time_out || undefined,
        totalHours: entry.total_hours || undefined,
        isLate: entry.is_late,
        isEarlyLeave: entry.is_early_leave,
      };
    });

    const averageHoursPerDay =
      presentDays > 0 ? totalHoursWorked / presentDays : 0;

    return {
      presentDays,
      absentDays,
      lateArrivals,
      earlyLeaves,
      totalHoursWorked,
      averageHoursPerDay,
      dailyAttendance,
    };
  }, [currentUser?.id, selectedMonth, selectedYear, entries]);

  if (!currentUser) {
    return null;
  }
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }
  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Employee Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Open profile menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                <span aria-hidden="true">{profileInitials}</span>
              </button>

              {profileMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white/95 p-2 text-sm shadow-lg backdrop-blur-sm"
                  role="menu"
                  aria-label="Profile menu"
                >
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {currentUser.first_name} {currentUser.last_name}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeProfileMenu();
                      setShowProfile(true);
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    role="menuitem"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="text-sm">View profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeProfileMenu();
                      setShowChangePassword(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    role="menuitem"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                      <span className="h-1.5 w-3 rounded-sm border border-slate-400" />
                    </span>
                    <span className="text-sm">Change password</span>
                  </button>
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeProfileMenu();
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      role="menuitem"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main
        className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-10 pt-8 sm:px-6 lg:px-8"
        aria-label="Employee dashboard content"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="attendance-analytics-heading"
              className="text-lg font-semibold text-slate-900 sm:text-xl"
            >
              Attendance Analytics
            </h2>
            <p className="text-sm text-slate-500">
              See your attendance patterns and trends for the selected period.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Showing data for{" "}
            {format(new Date(selectedYear, selectedMonth - 1, 1), "MMM yyyy")}
            <button
              onClick={() => {
                fetchAllData();
              }}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <RefreshCw size={14} />
            </button>
          </p>
        </div>

        <AttendanceKPICards analytics={data} />
        <section
          aria-labelledby="today-overview-heading"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <h2 id="today-overview-heading" className="sr-only">
            Today overview
          </h2>
          <div className="flex w-[1210px] lg:flex-row gap-4">
            {/* LEFT: My Info + Today's Events */}
            <div className=" flex-1 lg:w-1/2 border-indigo-100">
              <UserInfoCard
                cardBase={cardBase}
                todayBirthdays={todayBirthdays}
                todayAnniversaries={todayAnniversaries}
              />
              <Card className={`${cardBase} mt-3 h-[400px]`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Salary Section
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowSalaryView(true)}
                    className="w-full rounded-full text-sm font-medium"
                    variant="outline"
                  >
                    Salary summary
                  </Button>
                </CardContent>
              </Card>
            </div>
            <AttendanceTodayCard
              statusLoading={statusLoading}
              todayStatus={todayStatus}
              currentUser={currentUser}
              refetchStatus={refetchStatus}
              cardBase={cardBase}
              // refetchStatus={fetchTodayStatus}
            />
          </div>
        </section>
        <div className="flex w-[1210px] lg:flex-row gap-4">
          <UpcommingEvents
            upcomingBirthdays={upcomingBirthdays}
            upcomingAnniversaries={upcomingAnniversaries}
            cardBase={cardBase}
          />
          <UpcomingHoliday cardBase={cardBase} />
        </div>
        <section>
          <Card className={`${cardBase} lg:col-span-1`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Quick Attendance Overview
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Switch months to explore your recent patterns.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Working Hours Analytics
                </p>
                <div className="mt-2">
                  <WorkingHoursChartCard
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    standardHoursPerDay={currentUser.standard_hours_per_day}
                    onMonthChange={handleMonthChange}
                    availableMonths={months || []}
                    chartData={chartData}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        <section
          aria-labelledby="leave-and-actions-heading"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <h2 id="leave-and-actions-heading" className="sr-only">
            Leave, salary and extra work
          </h2>
          <Card className={cardBase}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Leave Summary</span>
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  Balances
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-400">
                <p>Sick Leaves: {sickLeaves}</p>
                <p>Casual Leaves: {casualLeaves}</p>
                <p>total Leaves: {casualLeaves + sickLeaves}</p>
              </div>
            </CardContent>
          </Card>

          <section
            aria-labelledby="leave-holidays-heading"
            className="space-y-4"
          >
            <div>
              <h2
                id="leave-holidays-heading"
                className="text-lg font-semibold text-slate-900 sm:text-xl"
              >
                Leave &amp; Holidays
              </h2>
              <p className="text-sm text-slate-500">
                Track your leave requests and upcoming company holidays.
              </p>
            </div>
            <Card className={cardBase}>
              <CardHeader className="">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Leave Requests
                </CardTitle>
                <Button
                  onClick={() => setShowLeaveRequest(true)}
                  className="mt-4 rounded-full px-1 text-sm"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request leave
                </Button>
              </CardHeader>

              <CardContent>
                {leaveRequests && leaveRequests.length > 0 ? (
                  <LeaveRequestsList
                    requests={leaveRequests}
                    employeeId={currentUser.id}
                    setLeaves={setLeaveRequests}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      No leave requests yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </section>
      </main>
      {showProfile && (
        <ProfilePopup
          employee={currentUser}
          onClose={() => setShowProfile(false)}
          onChangePassword={() => {
            setShowProfile(false);
            setShowChangePassword(true);
          }}
        />
      )}
      {showChangePassword && (
        <ChangePasswordPopup
          employee={currentUser}
          onClose={() => setShowChangePassword(false)}
        />
      )}
      {showLeaveRequest && (
        <LeaveRequestPopup
          employeeId={currentUser.id}
          onClose={() => setShowLeaveRequest(false)}
          leaves={leaveRequests}
          setLeaves={setLeaveRequests}
        />
      )}
      {showSalaryView && (
        <SalaryViewPopup
          employeeId={currentUser.id}
          onClose={() => setShowSalaryView(false)}
        />
      )}
    </div>
  );
}
