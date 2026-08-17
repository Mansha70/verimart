import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import methodOverride from "method-override";

import authRouter from "./routes/auth.routes.js";
import productRoute from "./routes/product.routes.js";
import transactionRouter from "./routes/transaction.route.js";
import reportRoute from "./routes/report.route.js";
import reviewRoute from "./routes/review.route.js";
import NotificationRouter from "./routes/Notification.route.js";
import router from "./routes/messageRoute.js";
import convRouter from "./routes/conversation.route.js";
import warningRouter from "./routes/warning.route.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Verimart Backend is running 🚀"
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