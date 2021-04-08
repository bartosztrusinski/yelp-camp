const express = require('express')
    , router = express.Router()
    , catchAsync = require('../utils/catchAsync')
    , campgrounds = require('../controllers/campgrounds')
    , {campgroundCreateBruteForce} = require('../utils/expressBrute')
    , upload = require('../cloudinary/upload');

const {
    isLoggedIn,
    isCampAuthorOrAdmin,
    validateCampground,
    validateImageCount,
    isValidCampgroundID
} = require('../middleware');


router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn,
        upload.array('image', 3),
        catchAsync(validateCampground),
        campgroundCreateBruteForce.prevent,
        catchAsync(campgrounds.createCampground))

router.get('/new',
    isLoggedIn,
    campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(isValidCampgroundID),
        catchAsync(campgrounds.showCampground))
    .put(isLoggedIn,
        catchAsync(isValidCampgroundID),
        isCampAuthorOrAdmin,
        upload.array('image', 3),
        validateImageCount,
        catchAsync(validateCampground),
        catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn,
        catchAsync(isValidCampgroundID),
        isCampAuthorOrAdmin,
        catchAsync(campgrounds.destroyCampground))

router.get('/:id/edit',
    isLoggedIn,
    catchAsync(isValidCampgroundID),
    isCampAuthorOrAdmin,
    catchAsync(campgrounds.renderEditForm))

module.exports = router;