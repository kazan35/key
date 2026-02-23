import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
  throw new Error("MONGO_URI não está definida nas variáveis de ambiente.");
}

async function dbConnect() {
  if (global._mongooseConn) return global._mongooseConn;

  const conn = await mongoose.connect(MONGO_URI, {
    bufferCommands: false,
  });

  global._mongooseConn = conn;
  return conn;
}

export default dbConnect;
