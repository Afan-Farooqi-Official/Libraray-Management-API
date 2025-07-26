import dotenv from "dotenv";

import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.error("Server error:", err);
      throw err;
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed!!! ", err);
    process.exit(1);
  });
