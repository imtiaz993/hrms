import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSalaryData() {
  console.log('Seeding salary data...\n');

  console.log('Step 1: Logging in as test employee...');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'employee@test.com',
    password: 'password123',
  });

  if (authError || !authData.user) {
    console.error('Error logging in:', authError);
    console.log('Please run the main seed script first to create test accounts.');
    return;
  }

  const employeeId = authData.user.id;
  console.log('✓ Logged in as employee@test.com');

  console.log('\nStep 2: Creating salary configuration...');

  const { data: existingConfig } = await supabase
    .from('salary_config')
    .select('*')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!existingConfig) {
    const salaryConfig = {
      employee_id: employeeId,
      salary_type: 'monthly',
      base_amount: 5000,
      overtime_multiplier: 1.5,
      currency: 'USD',
      effective_from: '2024-01-01',
    };

    const { error: configError } = await supabase
      .from('salary_config')
      .insert(salaryConfig);

    if (configError) {
      console.error('Error creating salary config:', configError);
    } else {
      console.log('✓ Salary configuration created');
    }
  } else {
    console.log('✓ Salary configuration already exists');
  }

  console.log('\nStep 3: Creating salary records...');

  const currentDate = new Date();
  const salaryRecords = [];

  for (let i = 2; i >= 0; i--) {
    const month = currentDate.getMonth() - i + 1;
    const year = currentDate.getFullYear();
    const adjustedMonth = month <= 0 ? month + 12 : month;
    const adjustedYear = month <= 0 ? year - 1 : year;

    const workingDays = 22;
    const daysPresent = 20 + Math.floor(Math.random() * 2);
    const daysAbsent = workingDays - daysPresent;
    const paidLeaveDays = Math.min(daysAbsent, 1);
    const unpaidLeaveDays = daysAbsent - paidLeaveDays;

    const standardHoursPerDay = 8;
    const totalHoursWorked = daysPresent * standardHoursPerDay + (Math.random() * 10);
    const overtimeHours = Math.max(0, totalHoursWorked - (daysPresent * standardHoursPerDay));

    const lateArrivals = Math.floor(Math.random() * 3);
    const earlyLeaves = Math.floor(Math.random() * 2);

    const basePay = 5000;
    const hourlyRate = basePay / (22 * 8);
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const allowances = 200;
    const unpaidLeaveDeduction = unpaidLeaveDays * (basePay / workingDays);
    const otherDeductions = basePay * 0.1;
    const netPay = basePay + overtimePay + allowances - unpaidLeaveDeduction - otherDeductions;

    const isProvisional = i === 0;

    salaryRecords.push({
      employee_id: employeeId,
      period_month: adjustedMonth,
      period_year: adjustedYear,
      working_days: workingDays,
      days_present: daysPresent,
      days_absent: daysAbsent,
      paid_leave_days: paidLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
      total_hours_worked: parseFloat(totalHoursWorked.toFixed(2)),
      overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      late_arrivals: lateArrivals,
      early_leaves: earlyLeaves,
      base_pay: parseFloat(basePay.toFixed(2)),
      overtime_pay: parseFloat(overtimePay.toFixed(2)),
      allowances: parseFloat(allowances.toFixed(2)),
      unpaid_leave_deduction: parseFloat(unpaidLeaveDeduction.toFixed(2)),
      other_deductions: parseFloat(otherDeductions.toFixed(2)),
      net_pay: parseFloat(netPay.toFixed(2)),
      is_provisional: isProvisional,
      notes: isProvisional ? 'This period is still in progress. Final salary may change.' : null,
    });
  }

  let createdCount = 0;
  for (const record of salaryRecords) {
    const { data: existing } = await supabase
      .from('salary_records')
      .select('id')
      .eq('employee_id', record.employee_id)
      .eq('period_year', record.period_year)
      .eq('period_month', record.period_month)
      .maybeSingle();

    if (!existing) {
      const { error: recordError } = await supabase
        .from('salary_records')
        .insert(record);

      if (recordError) {
        console.error(`Error creating salary record for ${record.period_year}-${record.period_month}:`, recordError);
      } else {
        createdCount++;
      }
    }
  }

  console.log(`✓ Created ${createdCount} salary records (${salaryRecords.length - createdCount} already existed)`);

  console.log('\n✓ Salary data seeding complete!\n');
}

seedSalaryData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });
