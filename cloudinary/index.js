const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'YelpCamp',
    allowedFormats: ['jpeg', 'png', 'jpg'],
  },
});

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

module.exports = {
  cloudinary,
  storage,
  deleteUploadedImages,
};
