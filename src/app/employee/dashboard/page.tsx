'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout as logoutAction } from '@/store/authSlice';
import { useLocalData } from '@/lib/local-data';
import { useGetTodayStatus, useGetRecentAttendance } from '@/hooks/useTimeEntry';
import { useGetLeaveBalances, useGetLeaveRequests, useGetUpcomingHolidays } from '@/hooks/useLeave';
import { useGetUpcomingBirthdays, useGetUpcomingAnniversaries } from '@/hooks/useEvents';
import { useGetAttendanceAnalytics, useGetAvailableMonths, DailyAttendance } from '@/hooks/useAttendanceAnalytics';
import { useGetAttendanceLog } from '@/hooks/useAttendanceLog';
import { useGetSalaryConfig, useGetAvailablePeriods, useGetSalaryRecord } from '@/hooks/useSalary';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Lock, Clock, Calendar, DollarSign, TrendingUp, FileText, Plus, X, LogOut, Cake, Award } from 'lucide-react';
import { AttendanceKPICards } from '@/components/attendance/attendance-kpi-cards';
import { AttendanceHeatmap } from '@/components/attendance/attendance-heatmap';
import { AttendanceInsights } from '@/components/attendance/attendance-insights';
import { DailyDetailsDialog } from '@/components/attendance/daily-details-dialog';
import { AttendanceLogSummaryComponent } from '@/components/attendance-log/attendance-log-summary';
import { DailyLogTable } from '@/components/attendance-log/daily-log-table';
import { UpcomingHolidays } from '@/components/leave/upcoming-holidays';
import { LeaveRequestsList } from '@/components/leave/leave-requests-list';
import { EventCard } from '@/components/events/event-card';
import { SalarySummaryCards } from '@/components/salary/salary-summary-cards';
import { SalaryBreakdown } from '@/components/salary/salary-breakdown';
import { AttendanceSummary } from '@/components/salary/attendance-summary';
import { SalaryConfigInfo } from '@/components/salary/salary-config-info';
import { ProfilePopup } from '@/components/employee/profile-popup';
import { ChangePasswordPopup } from '@/components/employee/change-password-popup';
import { LeaveRequestPopup } from '@/components/employee/leave-request-popup';
import { SalaryViewPopup } from '@/components/employee/salary-view-popup';
import { ExtraWorkPopup } from '@/components/employee/extra-work-popup';
import { AttendanceChartCard } from '@/components/employee/attendance-chart-card';
import { WorkingHoursChartCard } from '@/components/employee/working-hours-chart-card';
import { ClockActionCard } from '@/components/employee/clock-action-card';
import { TodayStatusCard } from '@/components/employee/today-status-card';


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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const {
    data: todayStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useGetTodayStatus(
    currentUser?.id || '',
    currentUser?.standard_hours_per_day || 8,
    currentUser?.standard_shift_start || '09:00'
  );

  const { data: leaveBalances } = useGetLeaveBalances(currentUser?.id || '');
  const { data: leaveRequests } = useGetLeaveRequests(currentUser?.id || '');
  const { data: holidays } = useGetUpcomingHolidays(90);
  const { data: birthdays } = useGetUpcomingBirthdays(30);
  const { data: anniversaries } = useGetUpcomingAnniversaries(30);
  const { data: analytics } = useGetAttendanceAnalytics(
    currentUser?.id || '',
    selectedMonth,
    selectedYear
  );
  const { data: logData } = useGetAttendanceLog(currentUser?.id || '', selectedMonth, selectedYear);
  const { data: months } = useGetAvailableMonths(currentUser?.id || '');
  const { data: salaryConfig } = useGetSalaryConfig(currentUser?.id || '');
  const { data: periods } = useGetAvailablePeriods(currentUser?.id || '');
  const { data: salaryRecord } = useGetSalaryRecord(
    currentUser?.id || '',
    selectedMonth,
    selectedYear
  );
  const [selectedDay, setSelectedDay] = useState<DailyAttendance | null>(null);

  const todayBirthdays = useMemo(() => {
    const today = format(new Date(2025, 11, 10), 'yyyy-MM-dd');
    return birthdays?.filter((b) => b.eventDate === today) || [];
  }, [birthdays]);

  const todayAnniversaries = useMemo(() => {
    const today = format(new Date(2025, 11, 10), 'yyyy-MM-dd');
    return anniversaries?.filter((a) => a.eventDate === today) || [];
  }, [anniversaries]);
  
  // Initialize selected month/year from available months
  useEffect(() => {
    if (months && months.length > 0 && selectedMonth === new Date().getMonth() + 1) {
      setSelectedMonth(months[0].month);
      setSelectedYear(months[0].year);
    }
  }, [months, selectedMonth]);

  const employeeExtraWork = useMemo(() => {
    return extraWork.filter((ew) => ew.employee_id === currentUser?.id) || [];
  }, [extraWork, currentUser?.id]);

  const handleLogout = () => {
    localStorage.removeItem('hrmsCurrentUser');
    dispatch(logoutAction());
    router.push('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Profile Icon */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome, {currentUser.first_name} {currentUser.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Profile"
              >
                <User className="h-6 w-6 text-gray-600" />
              </button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Row - Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* A. My Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>My Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Employee Name</p>
                <p className="text-lg font-semibold">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Today&apos;s Events</p>
                {todayBirthdays.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-pink-600">Birthdays:</p>
                    {todayBirthdays.map((b) => (
                      <p key={b.id} className="text-sm text-gray-700">
                        {b.employeeName}
                      </p>
                    ))}
                  </div>
                )}
                {todayAnniversaries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-600">Work Anniversaries:</p>
                    {todayAnniversaries.map((a) => (
                      <p key={a.id} className="text-sm text-gray-700">
                        {a.employeeName} ({a.yearsCompleted} years)
                      </p>
                    ))}
                  </div>
                )}
                {todayBirthdays.length === 0 && todayAnniversaries.length === 0 && (
                  <p className="text-sm text-gray-400">No events today</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* B. Attendance Today Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Today</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    onActionComplete={refetchStatus}
                  />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">You didn&apos;t mark your attendance.</p>
                  <Button onClick={() => refetchStatus()}>Refresh</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* C. Attendance Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceChartCard
                employeeId={currentUser.id}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={(month, year) => {
                  setSelectedMonth(month);
                  setSelectedYear(year);
                }}
                availableMonths={months || []}
              />
            </CardContent>
          </Card>

          {/* D. Working Hours Analytics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Working Hours Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkingHoursChartCard
                employeeId={currentUser.id}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                standardHoursPerDay={currentUser.standard_hours_per_day}
                onMonthChange={(month, year) => {
                  setSelectedMonth(month);
                  setSelectedYear(year);
                }}
                availableMonths={months || []}
              />
            </CardContent>
          </Card>

          {/* E. Leave Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveBalances && leaveBalances.length > 0 ? (
                <div className="space-y-3">
                  {leaveBalances.map((balance) => (
                    <div key={balance.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">{balance.leave_type} Leave</span>
                      <span className="text-sm text-gray-600">
                        {balance.remaining_days} / {balance.total_days} remaining
                      </span>
                    </div>
                  ))}
                  {(!leaveBalances.find((b) => b.leave_type === 'paid') ||
                    !leaveBalances.find((b) => b.leave_type === 'sick') ||
                    !leaveBalances.find((b) => b.leave_type === 'unpaid')) && (
                    <div className="text-xs text-gray-400 mt-2">
                      * Half-day and casual leaves are included in paid leave
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No leave balances available</p>
              )}
            </CardContent>
          </Card>

          {/* F. Requests & Approvals Card */}
          <Card>
            <CardHeader>
              <CardTitle>Requests & Approvals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowLeaveRequest(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
              {leaveRequests && leaveRequests.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leaveRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium capitalize">{request.leave_type}</p>
                          <p className="text-gray-500 text-xs">
                            {format(parseISO(request.start_date), 'MMM dd')} -{' '}
                            {format(parseISO(request.end_date), 'MMM dd')}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs capitalize ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No leave requests</p>
              )}
            </CardContent>
          </Card>

          {/* G. Salary Section Card */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Section</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowSalaryView(true)} className="w-full" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Salary Summary
              </Button>
            </CardContent>
          </Card>

          {/* H. Extra Work / Weekend Work Card */}
          <Card>
            <CardHeader>
              <CardTitle>Extra Work / Weekend Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowExtraWork(true)} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Request Extra Work Adjustment
              </Button>
              {employeeExtraWork.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employeeExtraWork.map((work) => (
                    <div key={work.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium capitalize">{work.work_type}</p>
                          <p className="text-gray-500 text-xs">
                            {format(parseISO(work.date), 'MMM dd, yyyy')} - {work.hours_worked}h
                          </p>
                          {work.reason && (
                            <p className="text-gray-400 text-xs mt-1">{work.reason}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs capitalize ${
                            work.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : work.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {work.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No extra work records</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance Analytics Section */}
        {analytics && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Analytics</h2>
            <AttendanceKPICards analytics={analytics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Heatmap</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceInsights analytics={analytics} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Attendance Log Section */}
        {logData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Daily Attendance Log</h2>
            <AttendanceLogSummaryComponent summary={logData.summary} />
            {logData.logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Day-wise Attendance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyLogTable logs={logData.logs} />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Leave & Holidays Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Leave & Holidays</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequests && leaveRequests.length > 0 ? (
                  <LeaveRequestsList requests={leaveRequests} employeeId={currentUser.id} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No leave requests</p>
                    <Button onClick={() => setShowLeaveRequest(true)} className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                {holidays && holidays.length > 0 ? (
                  <UpcomingHolidays holidays={holidays} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p>No upcoming holidays</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Events Section */}
        {(birthdays && birthdays.length > 0) || (anniversaries && anniversaries.length > 0) ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {birthdays && birthdays.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Cake className="h-5 w-5 text-pink-600" />
                      <span>Upcoming Birthdays</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {birthdays.map((event) => (
                        <EventCard key={event.id} event={event} type="birthday" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {anniversaries && anniversaries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      <span>Work Anniversaries</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {anniversaries.map((event) => (
                        <EventCard key={event.id} event={event} type="anniversary" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : null}

        {/* Salary Details Section */}
        {salaryRecord && salaryConfig && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Salary Details</h2>
            <SalarySummaryCards
              record={salaryRecord}
              currency={salaryConfig.currency || 'USD'}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalaryBreakdown
                record={salaryRecord}
                currency={salaryConfig.currency || 'USD'}
              />
              <AttendanceSummary record={salaryRecord} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Salary Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <SalaryConfigInfo
                  config={salaryConfig}
                  standardHoursPerDay={currentUser.standard_hours_per_day}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Pop-ups */}
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
      <DailyDetailsDialog day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
}
