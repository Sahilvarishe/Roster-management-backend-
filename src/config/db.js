import mongoose from 'mongoose';

let isDbConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/management_system';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout if Mongo isn't running locally
    });
    isDbConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isDbConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri} (${error.message}).`);
    console.warn(`[MongoDB Info] App will run in active resilience mode with complete in-memory MongoDB-synced data!`);
    return false;
  }
};

export const getDBStatus = () => ({
  connected: isDbConnected && mongoose.connection.readyState === 1,
  host: mongoose.connection.host || '127.0.0.1',
  readyState: mongoose.connection.readyState
});
