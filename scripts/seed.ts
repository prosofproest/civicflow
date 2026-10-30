/**
 * CivicFlow Synthetic Dataset Seeder CLI
 * 
 * Usage:
 *   npx -y tsx scripts/seed.ts
 */

import { seedSyntheticDataset } from "../src/lib/services/complaints";
import { SYNTHETIC_COMPLAINTS } from "../src/lib/data/mock-complaints";

async function run() {
  console.log(`Starting CivicFlow synthetic demo data initialization...`);
  console.log(`Target dataset size: ${SYNTHETIC_COMPLAINTS.length} complaints.`);

  try {
    const result = await seedSyntheticDataset();
    console.log(`✅ Success! Seeded ${result.seededCount} synthetic complaints.`);
    console.log(`Persistence destination: ${result.isFirestore ? "Google Cloud Firestore" : "Local In-Memory Demo Store"}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Seeding failed:`, err);
    process.exit(1);
  }
}

run();
