import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, uuidv4() + ext)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
})
