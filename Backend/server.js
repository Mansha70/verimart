import dotenv from 'dotenv'
if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}
import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import cors from "cors"
import methodOverride from "method-override"
import authRouter from "./routes/auth.routes.js"
import productRoute from "./routes/product.routes.js"
import transactionRouter from './routes/transaction.route.js'
import reportRoute from "./routes/report.route.js"
import reviewRoute from "./routes/review.route.js"
import NotificationRouter  from './routes/Notification.route.js'
import router from "./routes/messageRoute.js"
import convRouter from "./routes/conversation.route.js"
import warningRouter from "./routes/warning.route.js"

if (!process.env.MONGO_URL) {
  console.error('MONGO_URL not defined. Please set MONGO_URL in your environment or .env file.')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Serve uploaded product images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

async function main() {
  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000
  })
}

main()
  .then(() => {
    console.log("database connected successfully")

    app.use("/api/v1", authRouter)
    app.use("/api/v1/product", productRoute)
    app.use("/api/v1/transaction", transactionRouter)
    app.use("/api/v1/report",reportRoute)
    app.use("/api/v1/review",reviewRoute)
    app.use("/api/v1/notification",NotificationRouter)
    app.use("/api/v1/conversation",convRouter)
    app.use("/api/v1/message",router)
    app.use("/api/v1/warning", warningRouter)

const port = process.env.PORT || 4040
    app.listen(port, () => {
      console.log(`server started listening on ${port}`)
    })
  })
  .catch(err => {
    console.error('Database connection error:', err)
    process.exit(1)
  })
