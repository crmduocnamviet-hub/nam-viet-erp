import { supabase } from "./supabase";

// Sample doctor data for seeding
export const sampleDoctors: Omit<IEmployee, "employee_id">[] = [
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

// Sample pharmacists
export const samplePharmacists: Omit<IEmployee, "employee_id">[] = [
  {
    full_name: "DS. Nguyễn Thị Lan",
    employee_code: "PHAR001",
    role_name: "DuocSi",
    is_active: true,
  },
  {
    full_name: "DS. Trần Văn Nam",
    employee_code: "PHAR002",
    role_name: "DuocSi",
    is_active: true,
  },
  {
    full_name: "DS. Lê Thị Oanh",
    employee_code: "PHAR003",
    role_name: "DuocSi",
    is_active: true,
  },
];

// Sample receptionists
export const sampleReceptionists: Omit<IEmployee, "employee_id">[] = [
  {
    full_name: "Nguyễn Thị Phương",
    employee_code: "REC001",
    role_name: "LeTan",
    is_active: true,
  },
  {
    full_name: "Trần Văn Quang",
    employee_code: "REC002",
    role_name: "LeTan",
    is_active: true,
  },
  {
    full_name: "Lê Thị Rạng",
    employee_code: "REC003",
    role_name: "LeTan",
    is_active: true,
  },
];

// Function to seed all employees
export const seedEmployees = async () => {
  try {
    console.log("🌱 Starting employee seeding...");

    // Check if employees already exist
    const { data: existingEmployees } = await supabase
      .from("employees")
      .select("employee_code")
      .limit(1);

    if (existingEmployees && existingEmployees.length > 0) {
      console.log("⚠️  Employees already exist. Skipping seeding.");
      return { success: true, message: "Employees already exist" };
    }

    // Combine all employee types
    const allEmployees = [
      ...sampleDoctors,
      ...samplePharmacists,
      ...sampleReceptionists,
    ];

    // Insert employees
    const { data, error } = await supabase
      .from("employees")
      .insert(allEmployees)
      .select();

    if (error) {
      console.error("❌ Error seeding employees:", error);
      return { success: false, error };
    }

    console.log("✅ Successfully seeded employees:");
    console.log(`   - ${sampleDoctors.length} doctors`);
    console.log(`   - ${samplePharmacists.length} pharmacists`);
    console.log(`   - ${sampleReceptionists.length} receptionists`);
    console.log(`   - Total: ${allEmployees.length} employees`);

    return { success: true, data, count: allEmployees.length };

  } catch (error) {
    console.error("❌ Unexpected error during seeding:", error);
    return { success: false, error };
  }
};

// Function to seed only doctors
export const seedDoctors = async () => {
  try {
    console.log("🏥 Starting doctor seeding...");

    // Check if doctors already exist
    const { data: existingDoctors } = await supabase
      .from("employees")
      .select("employee_code")
      .eq("role_name", "BacSi")
      .limit(1);

    if (existingDoctors && existingDoctors.length > 0) {
      console.log("⚠️  Doctors already exist. Skipping seeding.");
      return { success: true, message: "Doctors already exist" };
    }

    // Insert doctors only
    const { data, error } = await supabase
      .from("employees")
      .insert(sampleDoctors)
      .select();

    if (error) {
      console.error("❌ Error seeding doctors:", error);
      return { success: false, error };
    }

    console.log(`✅ Successfully seeded ${sampleDoctors.length} doctors`);
    data?.forEach((doctor, index) => {
      console.log(`   ${index + 1}. ${doctor.full_name} (${doctor.employee_code})`);
    });

    return { success: true, data, count: sampleDoctors.length };

  } catch (error) {
    console.error("❌ Unexpected error during doctor seeding:", error);
    return { success: false, error };
  }
};

// Function to clear all employees (for testing)
export const clearEmployees = async () => {
  try {
    console.log("🗑️  Clearing all employees...");

    const { error } = await supabase
      .from("employees")
      .delete()
      .neq("employee_id", "00000000-0000-0000-0000-000000000000"); // Delete all except system user if exists

    if (error) {
      console.error("❌ Error clearing employees:", error);
      return { success: false, error };
    }

    console.log("✅ All employees cleared successfully");
    return { success: true };

  } catch (error) {
    console.error("❌ Unexpected error during clearing:", error);
    return { success: false, error };
  }
};

// Utility function to get all doctors
export const getAllDoctors = async () => {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("role_name", "BacSi")
      .eq("is_active", true)
      .order("full_name");

    if (error) {
      console.error("❌ Error fetching doctors:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("❌ Unexpected error fetching doctors:", error);
    return { success: false, error };
  }
};