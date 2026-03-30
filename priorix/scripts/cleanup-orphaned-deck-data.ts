/**
 * Migration: cleanup-orphaned-deck-data
 *
 * Removes UserCardProgress, UserStudySession, UserDeckActivity, and Favorites
 * records whose deckId references a deck that no longer exists.
 *
 * Run: npm run migrate:cleanup-orphaned-deck-data
 */

import fs from "fs";
import path from "path";

// Load .env.local (Next.js doesn't auto-load it outside the framework)
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

import mongoose from "mongoose";
import Deck from "../lib/models/Deck";
import UserCardProgress from "../lib/models/UserCardProgress";
import UserStudySession from "../lib/models/UserStudySession";
import UserDeckActivity from "../lib/models/UserDeckActivity";
import Favorites from "../lib/models/Favorites";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI or MONGODB_URI environment variable");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI as string);
  console.log("Connected to DB");

  // Get all valid deck IDs
  const existingDecks = await Deck.find({}).select("_id").lean();
  const validIds = existingDecks.map((d: any) => d._id);
  console.log(`Found ${validIds.length} existing decks`);

  const filter = { deckId: { $nin: validIds } };

  const [ucp, uss, uda, fav] = await Promise.all([
    UserCardProgress.deleteMany(filter),
    UserStudySession.deleteMany(filter),
    UserDeckActivity.deleteMany(filter),
    Favorites.deleteMany(filter),
  ]);

  console.log("Deleted orphaned records:");
  console.log(`  UserCardProgress : ${ucp.deletedCount}`);
  console.log(`  UserStudySession : ${uss.deletedCount}`);
  console.log(`  UserDeckActivity : ${uda.deletedCount}`);
  console.log(`  Favorites        : ${fav.deletedCount}`);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
