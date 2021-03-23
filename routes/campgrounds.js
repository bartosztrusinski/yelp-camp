const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
// const {campgroundSchema} = require('../schemas');
const {isLoggedIn, isAuthorOrAdmin, validateCampground, validateImageCount} = require('../middleware');
const campgrounds = require('../controllers/campgrounds');
const {campgroundCreateBruteForce} = require('../utils/expressBrute');
const upload = require('../cloudinary/upload');

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image', 3), catchAsync(validateCampground), campgroundCreateBruteForce.prevent, catchAsync(campgrounds.createCampground))

router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthorOrAdmin, upload.array('image', 3), catchAsync(validateImageCount), catchAsync(validateCampground), catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthorOrAdmin, catchAsync(campgrounds.destroyCampground))

router.get('/:id/edit', isLoggedIn, isAuthorOrAdmin, catchAsync(campgrounds.renderEditForm))

module.exports = router;