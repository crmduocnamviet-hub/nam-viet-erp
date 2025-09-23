// Simple Node.js script to seed doctor data
// Run with: node seed-doctors.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample doctor data
const sampleDoctors = [
  {
    full_name: "BS. Nguyễn Văn An",
    employee_code: "DOC001",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "BS. Trần Thị Bình",
    employee_code: "DOC002",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "BS. Lê Minh Châu",
    employee_code: "DOC003",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "BS. CKI. Phạm Hoàng Đức",
    employee_code: "DOC004",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "BS. Võ Thị Em",
    employee_code: "DOC005",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "BS. CKII. Hoàng Văn Phong",
    employee_code: "DOC006",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "BS. Đặng Thị Giang",
    employee_code: "DOC007",
    role_name: "BacSi",
    is_active: true,
  },
  {
    full_name: "ThS.BS. Lý Minh Hạnh",
    employee_code: "DOC008",
    role_name: "BacSi",
    is_active: true,
  },
];

async function seedDoctors() {
  try {
    console.log('🏥 Starting doctor seeding...');

    // Check if doctors already exist
    const { data: existingDoctors } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('role_name', 'BacSi')
      .limit(1);

    if (existingDoctors && existingDoctors.length > 0) {
      console.log('⚠️  Doctors already exist. Skipping seeding.');
      console.log('   Use "node seed-doctors.js clear" to clear existing data first.');
      return;
    }

    // Insert doctors
    const { data, error } = await supabase
      .from('employees')
      .insert(sampleDoctors)
      .select();

    if (error) {
      console.error('❌ Error seeding doctors:', error);
      return;
    }

    console.log(`✅ Successfully seeded ${sampleDoctors.length} doctors:`);
    data?.forEach((doctor, index) => {
      console.log(`   ${index + 1}. ${doctor.full_name} (${doctor.employee_code})`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function clearDoctors() {
  try {
    console.log('🗑️  Clearing all doctors...');

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('role_name', 'BacSi');

    if (error) {
      console.error('❌ Error clearing doctors:', error);
      return;
    }

    console.log('✅ All doctors cleared successfully');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function listDoctors() {
  try {
    console.log('📋 Listing all doctors...');

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('role_name', 'BacSi')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('❌ Error fetching doctors:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('   No doctors found in the system.');
      console.log('   Run "node seed-doctors.js" to seed sample doctors.');
      return;
    }

    console.log(`Found ${data.length} doctors:`);
    data.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.full_name} (${doctor.employee_code}) - ${doctor.role_name}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Main function
async function main() {
  const command = process.argv[2];

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase')) {
    console.error(`
❌ Error: Supabase configuration missing!

Please set your environment variables:
  export VITE_SUPABASE_URL="your-actual-supabase-url"
  export VITE_SUPABASE_ANON_KEY="your-actual-supabase-anon-key"

Or edit this file and replace the placeholder values.
    `);
    process.exit(1);
  }

  switch (command) {
    case 'clear':
      await clearDoctors();
      break;
    case 'list':
      await listDoctors();
      break;
    case undefined:
    case 'seed':
      await seedDoctors();
      break;
    default:
      console.log(`
🌱 Nam Việt ERP - Doctor Seeding Tool

Usage:
  node seed-doctors.js        - Seed sample doctors
  node seed-doctors.js clear  - Clear all doctors
  node seed-doctors.js list   - List existing doctors

Examples:
  # Seed doctors
  node seed-doctors.js

  # Clear all doctors
  node seed-doctors.js clear

  # List existing doctors
  node seed-doctors.js list

This will create 8 sample doctors with Vietnamese names and proper medical titles.
      `);
  }
}

main().catch(console.error);