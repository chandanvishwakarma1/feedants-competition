const mongoose = require("mongoose");

async function connectDB(uri) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] Connection error:", err);
  });
}

module.exports = connectDB;
