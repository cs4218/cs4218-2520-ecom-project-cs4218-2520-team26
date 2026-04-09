import mongoose from "mongoose";
import colors from "colors";
const connectDB = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not set");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
      serverSelectionTimeoutMS: Number(
        process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000,
      ),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
    });
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white,
    );
    return conn;
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
    throw error;
  }
};

export default connectDB;
