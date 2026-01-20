import { WorkingHoursChartCard } from "@/components/employee/working-hours-chart-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const QuickOverview = ({
  cardBase,
  selectedMonth,
  selectedYear,
  currentUser,
  handleMonthChange,
  months,
  chartData,
  isLoading,
}: any) => {
  return (
    <Card className={`${cardBase} lg:col-span-2`}>
      <CardHeader className="pb-3 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Quick Attendance Overview
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Switch months to explore your recent patterns.
          </p>
        </div>
        {months.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-").map(Number);
                handleMonthChange(month, year);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
            >
              {months.map((m: any) => (
                <option
                  key={`${m.year}-${m.month}`}
                  value={`${m.year}-${m.month}`}
                >
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </CardHeader>
      <div className="rounded-xl p-3 md:px-5">
        <div className="mt-2">
          <WorkingHoursChartCard
            standardHoursPerDay={currentUser.standard_hours_per_day}
            chartData={chartData}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Card>
  );
};

export default QuickOverview;
