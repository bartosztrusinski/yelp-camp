const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const campgroundsController = require('../controllers/campgrounds');
const upload = require('../cloudinary/upload');
const { campgroundCreateBruteForce } = require('../utils/expressBrute');
const {
  isLoggedIn,
  isCampAuthorOrAdmin,
  validateCampground,
  validateImageCount,
  isValidCampgroundID,
} = require('../middleware');

router
  .route('/')
  .get(catchAsync(campgroundsController.index))
  .post(
    isLoggedIn,
    upload.array('image', 3),
    catchAsync(validateCampground),
    campgroundCreateBruteForce.prevent,
    catchAsync(campgroundsController.createCampground)
  );

router.get('/new', isLoggedIn, campgroundsController.renderNewForm);

router
  .route('/:id')
  .get(
    catchAsync(isValidCampgroundID),
    catchAsync(campgroundsController.showCampground)
  )
  .put(
    isLoggedIn,
    catchAsync(isValidCampgroundID),
    isCampAuthorOrAdmin,
    upload.array('image', 3),
    validateImageCount,
    catchAsync(validateCampground),
    catchAsync(campgroundsController.updateCampground)
  )
  .delete(
    isLoggedIn,
    catchAsync(isValidCampgroundID),
    isCampAuthorOrAdmin,
    catchAsync(campgroundsController.destroyCampground)
  );

router.get(
  '/:id/edit',
  isLoggedIn,
  catchAsync(isValidCampgroundID),
  isCampAuthorOrAdmin,
  catchAsync(campgroundsController.renderEditForm)
);

module.exports = router;
