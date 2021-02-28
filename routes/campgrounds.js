const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const {campgroundSchema} = require('../schemas');
const {isLoggedIn} = require('../middleware');

const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

router.get('/', catchAsync(async (req, res) => {
    const allCampgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds: allCampgrounds});
}))

router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new');
})

router.post('/', isLoggedIn, validateCampground, catchAsync(async (req, res) => {
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
    const newCampground = new Campground(req.body.campground);
    await newCampground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${newCampground._id}`);
}))

router.get('/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    const foundCampground = await Campground.findById(id).populate('reviews');
    if (!foundCampground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campground: foundCampground});
}))

router.get('/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const {id} = req.params;
    const foundCampground = await Campground.findById(id);
    if (!foundCampground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', {campground: foundCampground});
}))

router.put('/:id', isLoggedIn, validateCampground, catchAsync(async (req, res) => {
    const {id} = req.params;
    const updatedCampground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${updatedCampground._id}`)
}))

router.delete('/:id', isLoggedIn, catchAsync(async (req, res) => {
    const {id} = req.params;
    const deletedCampground = await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
}))

module.exports = router;