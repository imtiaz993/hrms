"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";
import { useLocalData } from "@/lib/local-data";
import {
  useGetTodayStatus,
  useGetRecentAttendance,
} from "@/hooks/useTimeEntry";
import {
  useGetLeaveBalances,
  useGetLeaveRequests,
  useGetUpcomingHolidays,
} from "@/hooks/useLeave";
import {
  useGetUpcomingBirthdays,
  useGetUpcomingAnniversaries,
} from "@/hooks/useEvents";
import {
  useGetAttendanceAnalytics,
  useGetAvailableMonths,
  DailyAttendance,
} from "@/hooks/useAttendanceAnalytics";
import { useGetAttendanceLog } from "@/hooks/useAttendanceLog";
import {
  useGetSalaryConfig,
  useGetAvailablePeriods,
  useGetSalaryRecord,
} from "@/hooks/useSalary";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Plus, Calendar, Cake, Award } from "lucide-react";
import { AttendanceKPICards } from "@/components/attendance/attendance-kpi-cards";
import { AttendanceHeatmap } from "@/components/attendance/attendance-heatmap";
import { AttendanceInsights } from "@/components/attendance/attendance-insights";
import { DailyDetailsDialog } from "@/components/attendance/daily-details-dialog";
import { AttendanceLogSummaryComponent } from "@/components/attendance-log/attendance-log-summary";
import { DailyLogTable } from "@/components/attendance-log/daily-log-table";
import { UpcomingHolidays } from "@/components/leave/upcoming-holidays";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { EventCard } from "@/components/events/event-card";
import { SalarySummaryCards } from "@/components/salary/salary-summary-cards";
import { SalaryBreakdown } from "@/components/salary/salary-breakdown";
import { AttendanceSummary } from "@/components/salary/attendance-summary";
import { SalaryConfigInfo } from "@/components/salary/salary-config-info";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { ChangePasswordPopup } from "@/components/employee/change-password-popup";
import { LeaveRequestPopup } from "@/components/employee/leave-request-popup";
import { SalaryViewPopup } from "@/components/employee/salary-view-popup";
import { ExtraWorkPopup } from "@/components/employee/extra-work-popup";
import { AttendanceChartCard } from "@/components/employee/attendance-chart-card";
import { WorkingHoursChartCard } from "@/components/employee/working-hours-chart-card";
import { ClockActionCard } from "@/components/employee/clock-action-card";
import { TodayStatusCard } from "@/components/employee/today-status-card";
import { supabase } from "@/lib/Supabase";

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { extraWork } = useLocalData();

  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLeaveRequest, setShowLeaveRequest] = useState(false);
  const [showSalaryView, setShowSalaryView] = useState(false);
  const [showExtraWork, setShowExtraWork] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DailyAttendance | null>(null);


    

  const {
    data: todayStatus,
    isLoading: statusLoading,
  } = useGetTodayStatus(
    currentUser?.id || "",
    currentUser?.standard_hours_per_day || 8,
    currentUser?.standard_shift_start || "09:00"
  );

  const { data: leaveBalances } = useGetLeaveBalances(currentUser?.id || "");
  const { data: leaveRequests } = useGetLeaveRequests(currentUser?.id || "");
  const { data: holidays } = useGetUpcomingHolidays(90);
  const { data: birthdays } = useGetUpcomingBirthdays(30);
  const { data: anniversaries } = useGetUpcomingAnniversaries(30);
  const { data: analytics } = useGetAttendanceAnalytics(
    currentUser?.id || "",
    selectedMonth,
    selectedYear
  );
  const { data: logData } = useGetAttendanceLog(
    currentUser?.id || "",
    selectedMonth,
    selectedYear
  );
  const { data: months } = useGetAvailableMonths(currentUser?.id || "");
  const { data: salaryConfig } = useGetSalaryConfig(currentUser?.id || "");
  const { data: periods } = useGetAvailablePeriods(currentUser?.id || "");
  const { data: salaryRecord } = useGetSalaryRecord(
    currentUser?.id || "",
    selectedMonth,
    selectedYear
  );

  const todayBirthdays = useMemo(() => {
    const today = format(new Date(2025, 11, 10), "yyyy-MM-dd");
    return birthdays?.filter((b) => b.eventDate === today) || [];
  }, [birthdays]);

  const todayAnniversaries = useMemo(() => {
    const today = format(new Date(2025, 11, 10), "yyyy-MM-dd");
    return anniversaries?.filter((a) => a.eventDate === today) || [];
  }, [anniversaries]);

  // Initialize selected month/year from available months
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

  const employeeExtraWork = useMemo(() => {
    return extraWork.filter((ew) => ew.employee_id === currentUser?.id) || [];
  }, [extraWork, currentUser?.id]);

  const profileInitials = useMemo(() => {
    if (!currentUser) return "?";
    const first = currentUser.first_name?.charAt(0) ?? "";
    const last = currentUser.last_name?.charAt(0) ?? "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "?";
  }, [currentUser]);



  const handleLogout = async () => {
  try {
    // Supabase logout
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out:", err);
  }

  // Clear local user cache
  localStorage.removeItem("hrmsCurrentUser");

  // Update Redux auth state
  dispatch(logoutAction());

  // Redirect
  router.push("/login");
};

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const closeProfileMenu = () => setProfileMenuOpen(false);

  if (!currentUser) {
    return null;
  }


  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Employee
            </p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Employee Dashboard
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Welcome,&nbsp;
              <span className="font-medium">
                {currentUser.first_name} {currentUser.last_name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile menu */}
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
                      {/* lock icon look without importing Lock */}
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

            {/* Fallback logout button (kept for clarity / accessibility on desktop) */}
            {/* <Button
              variant="outline"
              size="sm"
              className="hidden items-center gap-2 rounded-full border-slate-200 bg-white/80 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </Button> */}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-10 pt-8 sm:px-6 lg:px-8"
        aria-label="Employee dashboard content"
      >
        {/* TOP: TODAY + QUICK OVERVIEW */}
        <section
          aria-labelledby="today-overview-heading"
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <h2 id="today-overview-heading" className="sr-only">
            Today overview
          </h2>

          {/* LEFT: My Info + Today's Events */}
          <Card className={`${cardBase} lg:col-span-1`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>My Info</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600">
                  Today
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Employee Name
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Today&apos;s Events
                </p>
                <div className="mt-2 space-y-2">
                  {todayBirthdays.length > 0 && (
                    <div className="rounded-xl bg-white/80 p-2.5 shadow-xs">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-pink-600">
                        <Cake className="h-3.5 w-3.5" />
                        Birthdays
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {todayBirthdays.map((b) => (
                          <p key={b.id} className="text-xs text-slate-700">
                            {b.employeeName}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {todayAnniversaries.length > 0 && (
                    <div className="rounded-xl bg-white/80 p-2.5 shadow-xs">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                        <Award className="h-3.5 w-3.5" />
                        Work Anniversaries
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {todayAnniversaries.map((a) => (
                          <p key={a.id} className="text-xs text-slate-700">
                            {a.employeeName} ({a.yearsCompleted} years)
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {todayBirthdays.length === 0 &&
                    todayAnniversaries.length === 0 && (
                      <p className="text-xs text-slate-400">No events today</p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MIDDLE: Attendance Today - primary action focus */}
          <Card className={`${cardBase} lg:col-span-1 border-indigo-100`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Attendance Today</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  Live
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2">
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-slate-500">
                    Loading today&apos;s status…
                  </p>
                </div>
              ) : todayStatus ? (
                <div className="space-y-4">
                  <TodayStatusCard status={todayStatus} />
                  <ClockActionCard
                    status={todayStatus}
                    employeeId={currentUser.id}
                    standardHours={currentUser.standard_hours_per_day}
                    standardShiftStart={currentUser.standard_shift_start}
                    standardShiftEnd={currentUser.standard_shift_end}
                    onActionComplete={() => {}}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 py-6 text-center">
                  <p className="text-sm text-slate-500">
                    You haven&apos;t marked your attendance yet.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    size="sm"
                    className="rounded-full px-4 text-xs font-medium"
                  >
                    Refresh status
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT: Compact charts overview */}
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
                  Attendance Chart
                </p>
                <div className="mt-2">
                  <AttendanceChartCard
                    employeeId={currentUser.id}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={handleMonthChange}
                    availableMonths={months || []}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Working Hours Analytics
                </p>
                <div className="mt-2">
                  <WorkingHoursChartCard
                    employeeId={currentUser.id}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    standardHoursPerDay={currentUser.standard_hours_per_day}
                    onMonthChange={handleMonthChange}
                    availableMonths={months || []}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECOND ROW: Leave, Requests, Salary, Extra Work */}
        <section
          aria-labelledby="leave-and-actions-heading"
          className="grid grid-cols-1 gap-6 lg:grid-cols-4"
        >
          <h2 id="leave-and-actions-heading" className="sr-only">
            Leave, salary and extra work
          </h2>

          {/* Leave Summary */}
          <Card className={`${cardBase} lg:col-span-2`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Leave Summary</span>
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  Balances
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaveBalances && leaveBalances.length > 0 ? (
                <div className="space-y-3">
                  {leaveBalances.map((balance) => (
                    <div
                      key={balance.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium capitalize text-slate-800">
                        {balance.leave_type} leave
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {balance.remaining_days} / {balance.total_days} days
                      </span>
                    </div>
                  ))}
                  {(!leaveBalances.find((b) => b.leave_type === "paid") ||
                    !leaveBalances.find((b) => b.leave_type === "sick") ||
                    !leaveBalances.find((b) => b.leave_type === "unpaid")) && (
                    <p className="text-[11px] text-slate-400">
                      * Half-day and casual leaves are counted under paid leave.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No leave balances available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Requests & Approvals */}
          <Card className={`${cardBase} lg:col-span-1`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Requests &amp; Approvals</span>
                <Button
                  size="sm"
                  className="rounded-full px-2.5 text-[11px] font-medium shadow-none"
                  onClick={() => setShowLeaveRequest(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaveRequests && leaveRequests.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {leaveRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-xl border border-slate-100 bg-white/80 p-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold capitalize text-slate-900">
                            {request.leave_type}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {format(parseISO(request.start_date), "MMM dd")} –{" "}
                            {format(parseISO(request.end_date), "MMM dd")}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                            request.status === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : request.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-6 text-center">
                  <p className="text-sm text-slate-500">
                    No leave requests yet.
                  </p>
                  <Button
                    onClick={() => setShowLeaveRequest(true)}
                    size="sm"
                    variant="outline"
                    className="mt-3 rounded-full border-slate-200 text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Request leave
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary & Extra Work - compact actions */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card className={cardBase}>
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

            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Extra / Weekend Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowExtraWork(true)}
                  className="w-full rounded-full text-sm font-medium"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request adjustment
                </Button>
                {employeeExtraWork.length > 0 ? (
                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1 text-xs">
                    {employeeExtraWork.map((work) => (
                      <div
                        key={work.id}
                        className="rounded-xl border border-slate-100 bg-white/80 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold capitalize text-slate-900">
                              {work.work_type}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {format(parseISO(work.date), "MMM dd, yyyy")} ·{" "}
                              {work.hours_worked}h
                            </p>
                            {work.reason && (
                              <p className="mt-1 text-[11px] text-slate-400">
                                {work.reason}
                              </p>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                              work.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : work.status === "rejected"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {work.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    No extra work records yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ATTENDANCE ANALYTICS */}
        {analytics && (
          <section
            aria-labelledby="attendance-analytics-heading"
            className="space-y-4"
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
                  See your attendance patterns and trends for the selected
                  period.
                </p>
              </div>
              {periods && periods.length > 0 && (
                <p className="text-xs text-slate-400">
                  Showing data for{" "}
                  {format(
                    new Date(selectedYear, selectedMonth - 1, 1),
                    "MMM yyyy"
                  )}
                </p>
              )}
            </div>

            <AttendanceKPICards analytics={analytics} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className={cardBase}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Attendance Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceHeatmap
                    dailyAttendance={analytics.dailyAttendance}
                    month={selectedMonth}
                    year={selectedYear}
                    onDayClick={setSelectedDay}
                  />
                </CardContent>
              </Card>

              <Card className={cardBase}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Attendance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceInsights analytics={analytics} />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* DAILY ATTENDANCE LOG */}
        {logData && (
          <section
            aria-labelledby="attendance-log-heading"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="attendance-log-heading"
                  className="text-lg font-semibold text-slate-900 sm:text-xl"
                >
                  Daily Attendance Log
                </h2>
                <p className="text-sm text-slate-500">
                  Detailed view of your day-by-day clock-ins, clock-outs and
                  hours.
                </p>
              </div>
            </div>

            <AttendanceLogSummaryComponent summary={logData.summary} />

            {logData.logs.length > 0 && (
              <Card className={cardBase}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Day-wise Attendance Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyLogTable logs={logData.logs} />
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* LEAVE & HOLIDAYS */}
        <section aria-labelledby="leave-holidays-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
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
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequests && leaveRequests.length > 0 ? (
                  <LeaveRequestsList
                    requests={leaveRequests}
                    employeeId={currentUser.id}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      No leave requests yet.
                    </p>
                    <Button
                      onClick={() => setShowLeaveRequest(true)}
                      className="mt-4 rounded-full px-4 text-sm"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Request leave
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>Upcoming Holidays</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {holidays && holidays.length > 0 ? (
                  <UpcomingHolidays holidays={holidays} />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-8 text-center">
                    <Calendar className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">
                      No upcoming holidays.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* EVENTS */}
        {(birthdays && birthdays.length > 0) ||
        (anniversaries && anniversaries.length > 0) ? (
          <section
            aria-labelledby="upcoming-events-heading"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="upcoming-events-heading"
                  className="text-lg font-semibold text-slate-900 sm:text-xl"
                >
                  Upcoming Events
                </h2>
                <p className="text-sm text-slate-500">
                  Celebrate birthdays and work anniversaries in your team.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {birthdays && birthdays.length > 0 && (
                <Card className={cardBase}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Cake className="h-4 w-4 text-pink-500" />
                      <span>Upcoming Birthdays</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {birthdays.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          type="birthday"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {anniversaries && anniversaries.length > 0 && (
                <Card className={cardBase}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span>Work Anniversaries</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {anniversaries.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          type="anniversary"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        ) : null}

        {/* SALARY DETAILS */}
        {salaryRecord && salaryConfig && (
          <section
            aria-labelledby="salary-details-heading"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="salary-details-heading"
                  className="text-lg font-semibold text-slate-900 sm:text-xl"
                >
                  Salary Details
                </h2>
                <p className="text-sm text-slate-500">
                  Breakdown of your salary, attendance impact and configuration.
                </p>
              </div>
            </div>

            <SalarySummaryCards
              record={salaryRecord}
              currency={salaryConfig.currency || "USD"}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className={cardBase}>
                <CardContent className="pt-4">
                  <SalaryBreakdown
                    record={salaryRecord}
                    currency={salaryConfig.currency || "USD"}
                  />
                </CardContent>
              </Card>

              <Card className={cardBase}>
                <CardContent className="pt-4">
                  <AttendanceSummary record={salaryRecord} />
                </CardContent>
              </Card>
            </div>

            <Card className={cardBase}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Salary Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalaryConfigInfo
                  config={salaryConfig}
                  standardHoursPerDay={currentUser.standard_hours_per_day}
                />
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* POPUPS / MODALS (functionality unchanged) */}
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
        />
      )}

      {showSalaryView && (
        <SalaryViewPopup
          employeeId={currentUser.id}
          onClose={() => setShowSalaryView(false)}
        />
      )}

      {showExtraWork && (
        <ExtraWorkPopup
          employeeId={currentUser.id}
          onClose={() => setShowExtraWork(false)}
        />
      )}

      {/* Daily Details Dialog */}
      <DailyDetailsDialog
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
