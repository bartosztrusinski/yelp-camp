const {deleteUploadedImages} = require('../cloudinary');

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(e => {
            deleteUploadedImages(req);
            next(e);
        });
    }
}

module.exports = catchAsync;