import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLeaveData() {
  console.log('Seeding leave data...\n');

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
  console.log('Employee ID:', employeeId);

  const { data: employeeRecord, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (empError || !employeeRecord) {
    console.log('Employee record not found, creating it now...');

    const { error: createError } = await supabase
      .from('employees')
      .upsert({
        id: employeeId,
        email: 'employee@test.com',
        first_name: 'John',
        last_name: 'Doe',
        designation: 'Software Engineer',
        department: 'Engineering',
        join_date: '2024-01-15',
        standard_shift_start: '09:00',
        standard_shift_end: '17:00',
        standard_hours_per_day: 8,
        is_admin: false,
        is_active: true,
      });

    if (createError) {
      console.error('Error creating employee record:', createError);
      return;
    }

    console.log('✓ Employee record created');
  } else {
    console.log('✓ Found employee record');
  }
  const currentYear = new Date().getFullYear();

  console.log('\nStep 2: Adding leave balances...');

  const leaveBalances = [
    {
      employee_id: employeeId,
      leave_type: 'paid',
      total_days: 20,
      used_days: 5,
      year: currentYear,
    },
    {
      employee_id: employeeId,
      leave_type: 'sick',
      total_days: 10,
      used_days: 2,
      year: currentYear,
    },
    {
      employee_id: employeeId,
      leave_type: 'unpaid',
      total_days: 0,
      used_days: 0,
      year: currentYear,
    },
  ];

  const { error: balanceError } = await supabase
    .from('leave_balances')
    .upsert(leaveBalances, { onConflict: 'employee_id,leave_type,year' });

  if (balanceError) {
    console.error('Error creating leave balances:', balanceError);
  } else {
    console.log('✓ Leave balances created');
  }

  console.log('\nStep 3: Adding holidays...');

  const holidays = [
    {
      name: "New Year's Day",
      date: `${currentYear + 1}-01-01`,
      is_recurring: true,
      description: 'New Year celebration',
    },
    {
      name: 'Independence Day',
      date: `${currentYear}-07-04`,
      is_recurring: true,
      description: 'National holiday',
    },
    {
      name: 'Christmas Day',
      date: `${currentYear}-12-25`,
      is_recurring: true,
      description: 'Christmas celebration',
    },
    {
      name: 'Company Retreat',
      date: `${currentYear}-09-15`,
      is_recurring: false,
      description: 'Annual company retreat',
    },
  ];

  const { error: holidayError } = await supabase
    .from('holidays')
    .upsert(holidays, { onConflict: 'name,date', ignoreDuplicates: true });

  if (holidayError) {
    console.error('Error creating holidays:', holidayError);
  } else {
    console.log('✓ Holidays created');
  }

  console.log('\n✓ Leave data seeding complete!\n');
}

seedLeaveData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });
