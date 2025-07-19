import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { ExpressError } from './utils/ExpressError.js';

const MAX_FILE_SIZE = 1024 * 1024 * 2;
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png'];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = multer.memoryStorage();

const deleteUploadedImages = (req) => {
  if (req.files) {
    for (let file of req.files) {
      cloudinary.uploader.destroy(file.filename);
    }
  }
  if (req.file) {
    cloudinary.uploader.destroy(req.file.filename);
  }
};

const saveImageToMemory = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: function (req, file, cb) {
    if (!ALLOWED_FORMATS.includes(file.mimetype.split('/')[1])) {
      return cb(
        new ExpressError(
          `Invalid file type. Only ${ALLOWED_FORMATS.join(', ')} are allowed`,
          400
        )
      );
    }

    return cb(null, true);
  },
});

const uploadImageFromMemory = (imageFile) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'YelpCamp', allowed_formats: ALLOWED_FORMATS },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(uploadResult);
        }
      )
      .end(imageFile.buffer);
  });
};

export {
  cloudinary,
  saveImageToMemory,
  uploadImageFromMemory,
  deleteUploadedImages,
};
