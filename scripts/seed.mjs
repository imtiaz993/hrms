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

async function seed() {
  console.log('Seeding database...\n');

  console.log('Step 1: Creating test employees...');

  const employee1Email = 'employee@gmail.com';
  const employee1Password = 'password123';

  const admin1Email = 'admin@gmail.com';
  const admin1Password = 'admin123';

  const { data: empAuth, error: empAuthError } = await supabase.auth.signUp({
    email: employee1Email,
    password: employee1Password,
  });

  if (empAuthError && !empAuthError.message.includes('already registered')) {
    console.error('Error creating employee auth:', empAuthError);
  } else if (empAuth.user) {
    const { error: empError } = await supabase
      .from('employees')
      .upsert({
        id: empAuth.user.id,
        email: employee1Email,
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

    if (empError) {
      console.error('Error creating employee record:', empError);
    } else {
      console.log(`✓ Employee created: ${employee1Email} / ${employee1Password}`);
    }
  }

  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signUp({
    email: admin1Email,
    password: admin1Password,
  });

  if (adminAuthError && !adminAuthError.message.includes('already registered')) {
    console.error('Error creating admin auth:', adminAuthError);
  } else if (adminAuth.user) {
    const { error: adminError } = await supabase
      .from('employees')
      .upsert({
        id: adminAuth.user.id,
        email: admin1Email,
        first_name: 'Admin',
        last_name: 'User',
        designation: 'HR Manager',
        department: 'Human Resources',
        join_date: '2023-01-01',
        standard_shift_start: '09:00',
        standard_shift_end: '17:00',
        standard_hours_per_day: 8,
        is_admin: true,
        is_active: true,
      });

    if (adminError) {
      console.error('Error creating admin record:', adminError);
    } else {
      console.log(`✓ Admin created: ${admin1Email} / ${admin1Password}`);
    }
  }

  console.log('\n✓ Seeding complete!\n');
  console.log('Test Accounts:');
  console.log('─────────────────────────────────────');
  console.log(`Employee: ${employee1Email}`);
  console.log(`Password: ${employee1Password}`);
  console.log('');
  console.log(`Admin: ${admin1Email}`);
  console.log(`Password: ${admin1Password}`);
  console.log('─────────────────────────────────────\n');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });
