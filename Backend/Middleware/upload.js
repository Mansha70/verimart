import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

const isVercel = process.env.VERCEL === "1"
const useCloudinary = process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET

const localUploadDir = path.join(isVercel ? "/tmp" : __dirname, "uploads", "products")

if (!isVercel) {
  fs.mkdirSync(localUploadDir, { recursive: true })
}

function fileToImage(file) {
  if (!file) return null
  if (useCloudinary && file.path) {
    return {
      url: file.path,
      public_id: file.filename || "",
    }
  }
  if (file.path) {
    const relative = file.path.split("uploads").pop().replace(/\\/g, "/")
    return {
      url: `/uploads${relative}`,
      public_id: file.filename || "",
    }
  }
  return null
}

const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, localUploadDir)
      },
      filename: (req, file, cb) => {
        const ext = (path.extname(file.originalname) || ".jpg").toLowerCase()
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        cb(null, unique)
      },
    })

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

export { upload, fileToImage }
export default upload
