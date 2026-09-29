import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import methodOverride from "method-override";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.routes.js";
import productRoute from "./routes/product.routes.js";
import transactionRouter from "./routes/transaction.route.js";
import reportRoute from "./routes/report.route.js";
import reviewRoute from "./routes/review.route.js";
import NotificationRouter from "./routes/Notification.route.js";
import router from "./routes/messageRoute.js";
import convRouter from "./routes/conversation.route.js";
import warningRouter from "./routes/warning.route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === "1";
const uploadDir = path.join(isVercel ? "/tmp" : __dirname, "uploads");

if (!isVercel) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL || "https://verimart-frontend.vercel.app",
      "https://verimart-pearl.vercel.app",
      "https://verimart-qhji3rwr9-manshapandey2556-gmailcoms-projects.vercel.app",
      "https://verimart-nub1driks-manshapandey2556-gmailcoms-projects.vercel.app",
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use("/uploads", express.static(uploadDir, {
  dotfiles: "allow",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".svg")) {
      res.setHeader("Content-Type", "image/svg+xml");
    }
  },
}));

const MONGO_URL = process.env.MONGO_URL;
if (MONGO_URL) {
  mongoose
    .connect(MONGO_URL)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.error("MONGO_URL is not defined");
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Verimart Backend is running 🚀",
  });
});

app.use("/api/v1", authRouter);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/transaction", transactionRouter);
app.use("/api/v1/report", reportRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/notification", NotificationRouter);
app.use("/api/v1/conversation", convRouter);
app.use("/api/v1/message", router);
app.use("/api/v1/warning", warningRouter);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4040;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
