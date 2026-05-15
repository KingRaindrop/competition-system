import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
const storage = multer.diskStorage({
    destination: config.uploadDir,
    filename(_req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    },
});
export const upload = multer({
    storage,
    limits: { fileSize: config.maxFileSize },
});
//# sourceMappingURL=upload.js.map