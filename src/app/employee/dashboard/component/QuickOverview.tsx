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
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Quick Attendance Overview
        </CardTitle>
        <p className="mt-1 text-xs text-slate-500">
          Switch months to explore your recent patterns.
        </p>
      </CardHeader>
      <div className="rounded-xl p-3 md:px-5">
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
    </Card>
  );
};

export default QuickOverview;
