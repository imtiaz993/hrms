import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedEventsData() {
  console.log('Seeding events data...\n');

  console.log('Step 1: Logging in as test employee...');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'employee@gmail.com',
    password: 'password123',
  });

  if (authError || !authData.user) {
    console.error('Error logging in:', authError);
    console.log('Please run the main seed script first to create test accounts.');
    return;
  }

  console.log('✓ Logged in as employee@test.com');

  console.log('\nStep 2: Updating employee birthdays...');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const upcomingBirthdayDate = new Date(currentYear, currentMonth, today.getDate() + 5);
  const recentAnniversaryDate = new Date(currentYear, currentMonth, today.getDate() + 10);

  const { data: employees } = await supabase
    .from('employees')
    .select('id, email, join_date')
    .limit(5);

  if (!employees || employees.length === 0) {
    console.log('No employees found to update.');
    return;
  }

  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];

    const birthdayYear = 1990 + i;
    const birthdayMonth = currentMonth;
    const birthdayDay = today.getDate() + (i * 3 + 2);

    const birthday = `${birthdayYear}-${String(birthdayMonth + 1).padStart(2, '0')}-${String(birthdayDay).padStart(2, '0')}`;

    const { error } = await supabase
      .from('employees')
      .update({ date_of_birth: birthday })
      .eq('id', employee.id);

    if (error) {
      console.error(`Error updating employee ${employee.email}:`, error);
    } else {
      console.log(`✓ Updated birthday for ${employee.email}`);
    }
  }

  console.log('\n✓ Events data seeding complete!\n');
}

seedEventsData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });
