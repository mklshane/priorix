/**
 * Migration: disable-notifications-existing-users
 *
 * Sets enableSmartNotifications to false for all existing UserLearningProfile
 * documents where the field is currently true or missing (pre-default-change).
 *
 * Run: npm run migrate:disable-notifications-existing-users
 */

import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

import mongoose from "mongoose";
import UserLearningProfile from "../lib/models/UserLearningProfile";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI or MONGODB_URI environment variable");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI as string);
  console.log("Connected to DB");

  const result = await UserLearningProfile.updateMany(
    {
      $or: [
        { enableSmartNotifications: true },
        { enableSmartNotifications: { $exists: false } },
      ],
    },
    { $set: { enableSmartNotifications: false } }
  );

  console.log(`Updated ${result.modifiedCount} profiles → enableSmartNotifications: false`);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
