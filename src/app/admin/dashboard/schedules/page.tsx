"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseUser";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarCheck } from "lucide-react";

export default function SchedulePage() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]); // Grouped data store karne ke liye
  const [fetching, setFetching] = useState(false); // Sirf table refresh ke liye

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

// 1. Fetching Section Clean karein
const handleCreateSchedules = async () => {
  setLoading(true);
  try {
    const daysCount = new Date(year, month + 1, 0).getDate();
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${daysCount}`;

    // Fix: Select * ta k saara data mile aur Admin filter hatana ho to hata dein
    const { data: emps } = await supabase.from('employees').select('*').eq('is_active', true)  .eq("is_admin", false);
    const { data: holidays } = await supabase.from('holidays').select('date').gte('date', start).lte('date', end);
    const { data: leaves } = await supabase.from('leave_requests').select('*').eq('status', 'approved');
  console.log("Found Approved Leaves:", leaves?.length);
    if (!emps) return alert("No employees found.");
    const holidayList = holidays?.map(h => h.date) || [];
    const batch = [];

    for (const emp of emps) {
      for (let d = 1; d <= daysCount; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const currentDate = new Date(year, month, d);
        const dayNum = currentDate.getDay();

        let status: any = "scheduled";
        let isOff = false;

        // --- Priority Logic (Simple version) ---
        const isHoliday = holidayList.includes(dateStr);
        const hasLeave = leaves?.some(l => l.employee_id === emp.id && dateStr >= l.start_date && dateStr <= l.end_date);
        const isWeekend = (dayNum === 0 || dayNum === 6);

        if (isHoliday) { status = "holiday"; isOff = true; }
        else if (hasLeave) { status = "leave"; isOff = true; } // Pehle holiday, phir leave
        else if (isWeekend) { status = "weekend"; isOff = true; }

        batch.push({
          id: `${emp.id}_${dateStr}`,
          employee_id: emp.id,
          date: dateStr,
          day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          shift_start: emp.standard_shift_start || '09:00:00',
          shift_end: emp.standard_shift_end || '18:00:00',
          standard_hours: emp.standard_hours_per_day || 8,
          grace_time: 15,
          is_off_day: isOff,
          status: status
        });
      }
    }

    const { error } = await supabase.from('work_schedules').upsert(batch);
    if (error) throw error;

    alert("Schedule Refreshed Successfully!");
    fetchSchedules(); // Table ko update karein
  } catch (err: any) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};


  const fetchSchedules = async () => {
    setFetching(true);
    try {
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

      // 1. Fetch data with Employee Names
      const { data, error } = await supabase
        .from("work_schedules")
        .select("*, employees(first_name, last_name)")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true });

      if (error) throw error;

      // 2. Grouping Logic (Employee ID ke hisab se ikatha karna)
      const grouped = data?.reduce((acc: any, item: any) => {
        const empId = item.employee_id;
        if (!acc[empId]) {
          acc[empId] = {
            id: empId,
            name: `${item.employees.first_name} ${item.employees.last_name}`,
            days: [],
          };
        }
        acc[empId].days.push(item);
        return acc;
      }, {});

      setSchedules(Object.values(grouped || {}));
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setFetching(false);
    }
  };
  

  // Jab bhi Month ya Year change ho, automatic fetch kare
  useEffect(() => {
    fetchSchedules();
  }, [month, year]);

  return (
    <>
      <div className="p-10 max-w-2xl mx-auto border mt-10 rounded-2xl shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-8">
          <CalendarCheck size={32} className="text-blue-600" />
          <h1 className="text-2xl font-bold">Schedule Generator</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleCreateSchedules}
          disabled={loading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            "Generate Monthly Schedule"
          )}
        </Button>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 italic text-center">
          Note: This will mark weekends, holidays, and approved leaves as Off
          Days.
        </div>
      </div>

      <div className="mt-10 overflow-hidden border rounded-xl bg-white shadow-sm">
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Schedule Preview (Visual)</h2>
          <div className="flex gap-4 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1">
              <i className="w-2 h-2 bg-emerald-500 rounded-full" /> Work
            </span>
            <span className="flex items-center gap-1">
              <i className="w-2 h-2 bg-rose-500 rounded-full" /> Holiday
            </span>
            <span className="flex items-center gap-1">
              <i className="w-2 h-2 bg-amber-400 rounded-full" /> Leave
            </span>
            <span className="flex items-center gap-1">
              <i className="w-2 h-2 bg-black rounded-full" /> Weekend
            </span>
          </div>
        </div>

        <div className="divide-y">
          {fetching ? (
            <div className="p-10 text-center text-gray-400 italic">
              Refreshing data...
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-10 text-center text-gray-400 italic">
              No schedules found for this month.
            </div>
          ) : (
            schedules.map((emp) => (
              <div
                key={emp.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="w-32 truncate font-medium text-sm text-gray-600">
                  {emp.name}
                </div>

                {/* QuickOverview Style Bars */}
                <div className="flex flex-1 gap-1 h-8 items-end justify-end px-4">
                  {emp.days.map((day: any) => {
                    const colors: any = {
                      scheduled: "bg-emerald-500",
                      holiday: "bg-rose-500",
                      leave: "bg-amber-400",
                      weekend: "bg-black",
                    };
                    return (
                      <div
                        key={day.id}
                        title={`${day.date}: ${day.status}`}
                        className={`w-full max-w-[12px] rounded-t-sm ${colors[day.status] || "bg-gray-200"}`}
                        style={{ height: day.is_off_day ? "40%" : "100%" }}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
