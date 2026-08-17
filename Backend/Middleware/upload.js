import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, "..", "uploads", "products")

// Ensure the uploads/products directory exists
fs.mkdirSync(uploadDir, { recursive: true })

// Local disk storage so images are stored on the server and served statically.
// This requires no external credentials and guarantees uploaded images show up.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
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
        fileSize: 5 * 1024 * 1024, // 5 MB per file
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

export default upload
