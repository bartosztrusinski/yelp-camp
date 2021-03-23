const multer = require('multer');
const {storage} = require('./index');
const ExpressError = require('../utils/ExpressError');

const upload = multer({
    storage, limits: {fileSize: 1024 * 1024 * 2}, fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
            return cb(new ExpressError('You can only upload images!', 400));
        } else {
            cb(null, true);
        }
    }
});

module.exports = upload;