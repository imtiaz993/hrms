"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isWeekend,
} from "date-fns";
 import { Eye } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import UpcomingHoliday from "./component/UpcomingHolidays";
import { AttendanceKPICards } from "@/components/attendance/attendance-kpi-cards";
import { supabase } from "@/lib/supabaseUser";
import UpcommingEvents from "./component/UpcommingEvents";
import AttendanceTodayCard from "./component/Attendance";
import { AttendanceAnalytics, DailyAttendance } from "@/types";
import { LeaveRequest } from "@/types";
import Header from "./component/header";
import Refetch from "./component/Refetch";
import QuickOverview from "./component/QuickOverview";
import CompanyPolicy from "./component/CompanyPolicy";
import Leaves from "./component/Leaves";
import Salary from "./component/Salary";
import TodayEvents from "./component/TodayEvents";
import AnnouceMent from "@/app/admin/dashboard/annoucement/page";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  timeEntryId: number;
  clockIn: string | null;
  clockOut: string;
}
interface Holiday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function EmployeeDashboardPage() {
  const { currentUser } = useAppSelector((state) => state.auth);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);


  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [sickLeaves, setSickLeaves] = useState(0);
  const [casualLeaves, setCasualLeaves] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    { id: string; employeeName: string }[]
  >([]);
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<
    { id: string; employeeName: string; yearsCompleted: number }[]
  >([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [todayBirthdays, setTodayBirthdays] = useState<
    { employeeName: string }[]
  >([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState<
    { employeeName: string; yearsCompleted: number }[]
  >([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    setIsLoading(false);

    if (!error && data) setAnnouncements(data);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchUpcomingEvents = async () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const { data, error } = await supabase.rpc(
      "employees_current_month_future",
    );

    if (error || !data) return;
    const upcomingBirthdays = data
      .filter((emp: any) => emp.date_of_birth)
      .map((emp: any) => {
        const dob = new Date(emp.date_of_birth);
        const birthdayThisYear = new Date(
          currentYear,
          dob.getMonth(),
          dob.getDate(),
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
          e.eventDate.getMonth() === currentMonth,
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
          join.getDate(),
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
          e.eventDate.getMonth() === currentMonth,
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
    standardShiftStart: string,
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
        clockOut: "",
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
      clockOut: "",
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
            currentUser.standard_shift_start,
          ),
        );
      }
    }

    setStatusLoading(false);
  };
  const fetchEmployee = async () => {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", currentUser?.id)
      .single();

    if (error || !employee) {
      throw error;
    }

    setSickLeaves(Number(employee.total_sick_leaves));
    setCasualLeaves(Number(employee.total_casual_leaves));

    return employee;
  };
  const fetchLeaves = async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", currentUser?.id)
      .order("start_date", { ascending: false });

    if (error) console.log(error);
    else setLeaveRequests(data || []);
  };

  const fetchEntries = async () => {
    setIsLoading(true);

    const start = format(
      startOfMonth(new Date(selectedYear, selectedMonth - 1)),
      "yyyy-MM-dd",
    );
    const end = format(
      endOfMonth(new Date(selectedYear, selectedMonth - 1)),
      "yyyy-MM-dd",
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
      .filter((h) => {
        if (h.is_recurring) {
          return (
            h.eventDate.getMonth() === currentMonth &&
            h.eventDate.getDate() >= today.getDate()
          );
        }
        return (
          h.eventDate.getFullYear() === currentYear &&
          h.eventDate.getMonth() === currentMonth &&
          h.eventDate >= today &&
          h.eventDate <= endOfMonth
        );
      })
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

    setHolidays(upcomingHolidays);
  };
  const fetchAllData = () => {
    fetchTodayStatus();
    fetchTodayEvents();
    fetchUpcomingEvents();
    fetchEmployee();
    fetchLeaves();
    fetchEntries();
    fetchHolidays();
  };
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchAllData();
  }, [
    currentUser?.id,
    currentUser?.standard_hours_per_day,
    currentUser?.standard_shift_start,
  ]);

  const refetchStatus = async () => {
    await Promise.all([fetchTodayStatus(), fetchEntries()]);
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

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
            "MMMM yyyy",
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

    const dailyAttendance: any = eachDayOfInterval({
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

      if (!entry && !isWeekend(day)) {
        absentDays++;
        return {
          date: dateStr,
          status: "absent",
          isLate: false,
          isEarlyLeave: false,
        };
      }

      if (entry) {
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
      }
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

  const cardBase =
    "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <Refetch
          fetchAllData={fetchAllData}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
        <AttendanceKPICards
          analytics={data}
          cardBase={cardBase}
          isLoading={isLoading}
        />
        <div className="grid md:grid-cols-3 gap-4">
          <AttendanceTodayCard
            statusLoading={statusLoading}
            todayStatus={todayStatus}
            currentUser={currentUser}
            refetchStatus={refetchStatus}
            cardBase={cardBase}
          />
          <QuickOverview
            cardBase={cardBase}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            currentUser={currentUser}
            handleMonthChange={handleMonthChange}
            months={months}
            chartData={chartData}
            isLoading={isLoading}
          />
          <TodayEvents
            cardBase={cardBase}
            todayBirthdays={todayBirthdays}
            todayAnniversaries={todayAnniversaries}
            isLoading={isLoading}
          />
          <UpcommingEvents
            upcomingBirthdays={upcomingBirthdays}
            upcomingAnniversaries={upcomingAnniversaries}
            cardBase={cardBase}
            isLoading={isLoading}
          />
          <UpcomingHoliday
            cardBase={cardBase}
            holidays={holidays}
            isLoading={isLoading}
          />
        </div>

        <div className=" grid grid-cols-2 gap-4">
          <CompanyPolicy cardBase={cardBase} />
          <Leaves
            cardBase={cardBase}
            sickLeaves={sickLeaves}
            casualLeaves={casualLeaves}
            leaveRequests={leaveRequests}
            currentUser={currentUser}
            setLeaveRequests={setLeaveRequests}
            isLoading={isLoading}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Salary cardBase={cardBase} currentUser={currentUser} />

         <div className={`${cardBase} p-4`}>
  <h3 className="mb-4 text-lg font-semibold text-slate-800">
    Announcements
  </h3>



<div className="space-y-4">
  {announcements.length === 0 ? (
    <p className="text-sm text-slate-400">
      No announcements available
    </p>
  ) : (
    announcements.map((a) => (
      <div
        key={a.id}
        className="border rounded-lg p-3 hover:bg-slate-50 transition flex justify-between items-start"
      >
        {/* Left Content */}
        <div className="flex-1 pr-3">
          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-800">
            {a.title}
          </h4>

          {/* One-line description */}
          <p className="text-sm text-slate-600 truncate mt-1">
            {a.description}
          </p>
        </div>

        {/* Eye Button Right Side */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSelectedAnnouncement(a)}
          className="shrink-0"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    ))
  )}
</div>

</div>
<Dialog
  open={!!selectedAnnouncement}
  onOpenChange={() => setSelectedAnnouncement(null)}
>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>
        {selectedAnnouncement?.title}
      </DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        {selectedAnnouncement &&
          new Date(selectedAnnouncement.created_at).toLocaleDateString()}
      </DialogDescription>
    </DialogHeader>

    <div className="mt-4 text-sm text-slate-700 whitespace-pre-line">
      {selectedAnnouncement?.description}
    </div>

    <DialogFooter className="mt-4">
      <Button
        variant="outline"
        onClick={() => setSelectedAnnouncement(null)}
      >
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        </div>
      </main>
    </div>
  );
}
