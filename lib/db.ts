import mongoose from "mongoose";

const uri = process.env.DATABASE_URL!;
let conn: typeof mongoose | null = null;

export async function db() {
  if (conn) return conn;
  
  try {
    conn = await mongoose.connect(uri, { 
      dbName: "sales-sim",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB via Mongoose');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Ensure connection is established
export async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await db();
  }
  return mongoose.connection;
}

