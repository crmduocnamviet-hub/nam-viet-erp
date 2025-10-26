#!/usr/bin/env ts-node

import {
  seedEmployees,
  seedDoctors,
  clearEmployees,
  getAllDoctors,
} from "./seedDoctors";

// CLI interface for seeding
const main = async () => {
  const command = process.argv[2];

  switch (command) {
    case "doctors":
      console.log("🏥 Seeding doctors only...");
      await seedDoctors();
      break;

    case "all":
      console.log(
        "👥 Seeding all employees (doctors, pharmacists, receptionists)...",
      );
      await seedEmployees();
      break;

    case "clear":
      console.log("🗑️  Clearing all employees...");
      await clearEmployees();
      break;

    case "list":
      console.log("📋 Listing all doctors...");
      const result = await getAllDoctors();
      if (result.success && result.data) {
        console.log(`Found ${result.data.length} doctors:`);
        result.data.forEach((doctor, index) => {
          console.log(
            `  ${index + 1}. ${doctor.full_name} (${doctor.employee_code}) - ${doctor.role_name}`,
          );
        });
      }
      break;

    default:
      console.log(`
🌱 Nam Việt ERP - Employee Seeding Tool

Usage:
  npm run seed:doctors    - Seed sample doctors only
  npm run seed:all       - Seed all employees (doctors, pharmacists, receptionists)
  npm run seed:clear     - Clear all employees
  npm run seed:list      - List all existing doctors

Examples:
  # Seed doctors only
  ts-node apps/services/runSeeding.ts doctors

  # Seed all employees
  ts-node apps/services/runSeeding.ts all

  # Clear all data
  ts-node apps/services/runSeeding.ts clear

  # List existing doctors
  ts-node apps/services/runSeeding.ts list

Sample Doctors Being Seeded:
  - BS. Nguyễn Văn An (DOC001)
  - BS. Trần Thị Bình (DOC002)
  - BS. Lê Minh Châu (DOC003)
  - BS. CKI. Phạm Hoàng Đức (DOC004)
  - BS. Võ Thị Em (DOC005)
  - BS. CKII. Hoàng Văn Phong (DOC006)
  - BS. Đặng Thị Giang (DOC007)
  - ThS.BS. Lý Minh Hạnh (DOC008)

Sample Pharmacists:
  - DS. Nguyễn Thị Lan (PHAR001)
  - DS. Trần Văn Nam (PHAR002)
  - DS. Lê Thị Oanh (PHAR003)

Sample Receptionists:
  - Nguyễn Thị Phương (REC001)
  - Trần Văn Quang (REC002)
  - Lê Thị Rạng (REC003)
      `);
  }

  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
