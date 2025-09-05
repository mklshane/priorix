import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = (globalThis as any).mongooseCache as MongooseCache | undefined;

if (!cached) {
  cached = { conn: null, promise: null };
  (globalThis as any).mongooseCache = cached;
}

export const ConnectDB = async (): Promise<typeof mongoose> => {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGO_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
    console.log("DB connected");
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    console.error("Error connecting to DB:", error);
    throw error;
  }
};
